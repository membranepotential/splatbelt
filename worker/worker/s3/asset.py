from pathlib import Path
from pydantic import BaseModel
from dagster import OutputContext, InputContext, OpExecutionContext


class S3Asset(BaseModel):
    name: str
    project_id: str

    @classmethod
    def from_context(
        cls, context: OutputContext | InputContext | OpExecutionContext
    ) -> "S3Asset":
        asset = cls(
            name=context.asset_key.to_user_string(),
            project_id=context.partition_key,
        )
        asset.path.mkdir(parents=True, exist_ok=True)
        return asset

    @property
    def path(self) -> Path:
        return Path.cwd() / self.name

    @property
    def s3_key(self) -> str:
        return f"{self.project_id}/{self.name}.zip"

    def exists(self) -> bool:
        return self.path.exists()
