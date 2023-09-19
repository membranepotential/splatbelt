from pathlib import Path

from dagster import ConfigurableResource, get_dagster_logger
from pydantic import PrivateAttr
from subprocess import run
import zlib

from .asset import S3Asset
from .file_resource import S3FileResource
from .zip_index import ZipIndex


class S3ZipResource(ConfigurableResource):
    s3: S3FileResource

    _logger = PrivateAttr(default=None)

    @property
    def logger(self):
        if self._logger is None:
            self._logger = get_dagster_logger("S3ZipResource")
        return self._logger

    @staticmethod
    def path_as_zip(path: Path) -> Path:
        return path.with_name(path.name + ".zip")

    def zip_folder(self, path: Path) -> Path:
        zipped = self.path_as_zip(path)
        command = ["zip", "--symlinks", "-qr", str(zipped), path.name]
        run(command, cwd=path.parent)
        return zipped

    def unzip_folder(self, path: Path, zipped: Path | None = None):
        if zipped is None:
            zipped = self.path_as_zip(path)
        command = ["unzip", "-qo", str(zipped)]
        run(command, cwd=path.parent)

    def pull_file(
        self,
        path: Path,
        key: str,
        replace_existing: bool = False,
    ) -> Path:
        zipped = self.path_as_zip(path)
        self.s3.pull_file(zipped, key, replace_existing)
        self.unzip_folder(path, zipped)
        return path

    def pull_asset(self, asset: S3Asset, replace_existing: bool = False):
        self.pull_file(
            asset.path,
            asset.s3_key,
            replace_existing,
        )

    def push_file(
        self,
        path: Path,
        key: str,
        metadata: None | dict = None,
        create_index: bool = False,
    ):
        if path.is_dir() and not list(path.iterdir()):
            raise ValueError(f"Zipped asset {key} is empty")

        zipfile = self.zip_folder(path)
        self.s3.push_file(zipfile, key, metadata=metadata)

        if create_index:
            index = ZipIndex.read_archive(zipfile)
            index_path = zipfile.with_name(zipfile.name + ".index")
            index.save(index_path)
            self.s3.push_file(index_path, key + ".index")

    def push_asset(self, asset: S3Asset, create_index: bool = False):
        self.push_file(
            asset.path,
            asset.s3_key,
            create_index=create_index,
        )

    def load_index(self, asset: S3Asset) -> ZipIndex:
        index_path = asset.path.with_name(asset.name + ".index")
        self.s3.pull_file(index_path, asset.s3_key + ".index")
        return ZipIndex.load(index_path)

    def extract_file(self, asset: S3Asset, name: str) -> bytes:
        index = self.load_index(asset)
        entry = index.find(name)

        response = self.s3.client.get_object(
            Bucket=self.s3.bucket,
            Key=asset.s3_key,
            Range=entry.range_header,
        )
        return zlib.decompress(response["Body"].read(), -15)
