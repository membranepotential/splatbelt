import tempfile
from pathlib import Path
import shutil

import pytest
import boto3
from moto import mock_s3

from dagster import build_input_context, build_output_context
from dagster_aws.s3 import S3Resource

from worker.s3 import (
    S3Asset,
    S3FileIOManager,
    S3FileResource,
    S3ZipResource,
)

PROJECT_ID = "test-project"
BUCKET_NAME = "test-bucket"

TEST_FILE_NAME = "test.txt"
TEST_FILE_CONTENT = "test\n" * 5

TEST_DIR_NAME = "test"
TEST_DIR_CONTENT = {
    "test_0.txt": "test\n" * 5,
    "test_1.txt": "test\n" * 20,
    "test_2.txt": "test\n" * 10,
}


@pytest.fixture
def workspace():
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def workspace_empty():
    with tempfile.TemporaryDirectory() as tmpdir:
        yield Path(tmpdir)


@pytest.fixture
def s3_client():
    with mock_s3():
        conn = boto3.client("s3", region_name="us-east-1")
        conn.create_bucket(Bucket=BUCKET_NAME)
        yield conn


@pytest.fixture
def s3_file_resource(s3_client):
    s3_resource = S3Resource()
    s3_file_resource = S3FileResource(s3=s3_resource, bucket=BUCKET_NAME)
    s3_file_resource.setup_for_execution(None)
    return s3_file_resource


@pytest.fixture
def s3_zip_resource(s3_file_resource):
    return S3ZipResource(s3=s3_file_resource)


@pytest.fixture
def s3_file_io_manager(workspace_empty, s3_file_resource, s3_zip_resource):
    return S3FileIOManager(
        s3=s3_file_resource,
        s3zip=s3_zip_resource,
        workspace=str(workspace_empty),
    )


@pytest.fixture
def test_file(workspace) -> Path:
    path = workspace / TEST_FILE_NAME
    path.write_text(TEST_FILE_CONTENT)
    yield path


@pytest.fixture
def test_dir(workspace):
    dir = workspace / TEST_DIR_NAME
    dir.mkdir()
    for name, content in TEST_DIR_CONTENT.items():
        (dir / name).write_text(content)
    yield dir


@pytest.fixture
def file_asset(test_file):
    return S3Asset.from_path(
        path=test_file,
        key="test_asset",
        project_id=PROJECT_ID,
    )


@pytest.fixture
def dir_asset(test_dir):
    return S3Asset.from_path(
        path=test_dir,
        key="test_asset",
        project_id=PROJECT_ID,
        metadata={"indexed": True},
    )


@pytest.fixture
def s3_file_asset(s3_file_resource, file_asset, workspace_empty):
    s3_file_resource.push_asset(file_asset)
    return file_asset.copy(update={"workspace": workspace_empty})


@pytest.fixture
def s3_dir_asset(s3_zip_resource, dir_asset, workspace_empty):
    s3_zip_resource.push_asset(dir_asset)
    return dir_asset.copy(update={"workspace": workspace_empty})


def assert_s3_keys(s3_client, expected_keys):
    objects = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix=PROJECT_ID)
    keys = [content["Key"] for content in objects["Contents"]]
    assert set(keys) == set(expected_keys)


def test_push_file_asset(s3_client, s3_file_resource, file_asset):
    s3_file_resource.push_asset(file_asset)
    assert_s3_keys(s3_client, [file_asset.s3_key])


def test_push_dir_asset(s3_client, s3_zip_resource, dir_asset):
    s3_zip_resource.push_asset(dir_asset)
    assert_s3_keys(s3_client, [dir_asset.s3_key, dir_asset.s3_key + ".index"])


def test_pull_file_asset(s3_file_resource, s3_file_asset):
    s3_file_resource.pull_asset(s3_file_asset)
    assert s3_file_asset.path.exists()


def test_pull_dir_asset(s3_zip_resource, s3_dir_asset):
    s3_zip_resource.pull_asset(s3_dir_asset)
    assert s3_dir_asset.path.exists()

    content = {p.name: p.read_text() for p in s3_dir_asset.path.iterdir()}
    assert content == TEST_DIR_CONTENT


@pytest.mark.parametrize("output_is_path", [True, False])
def test_io_manager_output(
    s3_client,
    s3_file_io_manager,
    file_asset,
    output_is_path,
):
    context = build_output_context(
        partition_key=PROJECT_ID,
        asset_key=[file_asset.key],
        metadata=file_asset.metadata.dict(),
    )
    if output_is_path:
        s3_file_io_manager.handle_output(context, file_asset.path)
    else:
        s3_file_io_manager.handle_output(context, file_asset)

    assert_s3_keys(s3_client, [file_asset.s3_key])


def test_io_manager_input__upstream(s3_file_io_manager, s3_file_asset):
    upstream = build_output_context(
        partition_key=PROJECT_ID,
        asset_key=[s3_file_asset.key],
        metadata=s3_file_asset.metadata.dict(),
    )
    context = build_input_context(
        upstream_output=upstream,
    )
    input_asset = s3_file_io_manager.load_input(context)

    assert input_asset.key == s3_file_asset.key
    assert input_asset.project_id == s3_file_asset.project_id
    assert input_asset.metadata == s3_file_asset.metadata
    assert input_asset.exists()


def test_io_manager_input__novel(s3_file_io_manager, s3_file_asset):
    context = build_input_context(
        upstream_output=None,
        partition_key=PROJECT_ID,
        asset_key=[s3_file_asset.key],
        metadata=s3_file_asset.metadata.dict(),
    )
    input_asset = s3_file_io_manager.load_input(context)

    assert input_asset.key == s3_file_asset.key
    assert input_asset.project_id == s3_file_asset.project_id
    assert input_asset.metadata == s3_file_asset.metadata
    assert input_asset.exists()


def test_extract_file(s3_zip_resource, s3_dir_asset):
    index = s3_zip_resource.load_index(s3_dir_asset)
    extracted = {
        name: s3_zip_resource.extract_file(s3_dir_asset, name).decode()
        for name in index
    }
    assert extracted == TEST_DIR_CONTENT
