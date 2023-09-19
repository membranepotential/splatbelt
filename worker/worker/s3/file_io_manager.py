from pathlib import Path

from dagster import ConfigurableIOManager, OutputContext, InputContext

from .asset import S3Asset
from .file_resource import S3FileResource
from .zip_resource import S3ZipResource


class S3FileIOManager(ConfigurableIOManager):
    s3: S3FileResource
    s3zip: S3ZipResource

    @property
    def workspace(self) -> Path:
        return Path.cwd()

    def handle_output(self, context: OutputContext, obj: S3Asset):
        self.s3zip.push_asset(obj)

    def load_input(self, context: InputContext) -> S3Asset:
        asset = S3Asset.from_context(context)
        if not asset.exists():
            self.s3zip.pull_asset(asset)
        return asset
