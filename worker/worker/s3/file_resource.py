from pathlib import Path

from botocore.exceptions import ClientError
from dagster import ConfigurableResource, get_dagster_logger
from dagster_aws.s3 import S3Resource
from pydantic import PrivateAttr

from .asset import S3Asset


class S3FileResource(ConfigurableResource):
    bucket: str
    s3: S3Resource

    _client = PrivateAttr()

    def setup_for_execution(self, context):
        self._client = self.s3.get_client()

    @property
    def client(self):
        return self._client

    @staticmethod
    def _join_key(key: str, prefixes: list[str]) -> str:
        if prefixes:
            return "/".join(prefixes) + "/" + key
        return key

    def _log_info(self, message: str, *args):
        get_dagster_logger("S3FileResource").info(message, *args)

    def list_keys(self, prefix: str) -> list[str]:
        response = self.client.list_objects_v2(Bucket=self.bucket, Prefix=prefix)
        contents = response.get("Contents", [])
        return [content["Key"][len(prefix) + 1 :] for content in contents]

    def exists(self, key: str) -> bool:
        try:
            response = self.client.head_object(Bucket=self.bucket, Key=key)
            return response["ResponseMetadata"]["HTTPStatusCode"] == 200
        except ClientError:
            return False

    def get_metadata(self, key: str):
        response = self.client.head_object(Bucket=self.bucket, Key=key)
        return response.get("Metadata", {})

    def pull_file(
        self,
        path: Path,
        key: str,
        replace_existing: bool = False,
    ) -> Path:
        if not replace_existing and path.exists():
            self._log_info("Skipping download of %s to %s", key, path)

        self._log_info("Downloading %s to %s", key, path)
        try:
            self.client.download_file(self.bucket, key, str(path))
        except ClientError as error:
            if error.response["Error"]["Code"] == "404":
                raise FileNotFoundError(f"Key {key} not found on S3")
            raise
        return path

    def pull_asset(self, asset: S3Asset, replace_existing: bool = False):
        self.pull_file(asset.path, asset.s3_key, replace_existing)

    def push_file(
        self,
        path: Path,
        key: str,
        metadata: None | dict = None,
    ):
        self._log_info("Uploading %s to %s", path, key)
        self.client.upload_file(
            str(path),
            self.bucket,
            key,
            ExtraArgs={"Metadata": metadata or {}},
        )

    def push_asset(self, asset: S3Asset):
        self.push_file(asset.path, asset.s3_key)
