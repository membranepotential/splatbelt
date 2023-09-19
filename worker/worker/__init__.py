from dagster import EnvVar, Definitions
from dagster_aws.s3 import S3Resource

from worker.s3 import S3FileResource, S3ZipResource, S3FileIOManager
from worker.postgres import PostgresDBResource

from worker import analyse


s3 = S3FileResource(
    bucket=EnvVar("S3_BUCKET"),
    s3=S3Resource(endpoint_url=EnvVar("S3_ENDPOINT")),
)
s3zip = S3ZipResource(s3=s3)
s3io = S3FileIOManager(s3=s3, s3zip=s3zip)

defs = Definitions(
    assets=[*analyse.assets],
    jobs=[analyse.job],
    resources={
        "postgres": PostgresDBResource(
            user=EnvVar("POSTGRES_USER"),
            password=EnvVar("POSTGRES_PASSWORD"),
            host=EnvVar("POSTGRES_HOST"),
        ),
        "s3": s3,
        "s3zip": s3zip,
        "io_manager": s3io,
    },
)
