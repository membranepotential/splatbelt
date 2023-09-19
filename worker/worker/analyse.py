from pathlib import Path
import shutil

from dagster import (
    asset,
    op,
    OpExecutionContext,
    define_asset_job,
    load_assets_from_current_module,
)
from dagster_docker import docker_executor, docker_container_op

from worker.project_partition import project_partition
from worker.s3 import S3Asset, S3FileResource
from worker.config import (
    FrameConfig,
    PairingConfig,
    FeatureMatchingConfig,
    GaussianSplattingConfig,
)
from worker.video import Video, extract_frames
from worker.utils import execute_command_in_context, execute_script


@asset(partitions_def=project_partition)
def frames(
    context: OpExecutionContext,
    config: FrameConfig,
    s3: S3FileResource,
) -> S3Asset:
    workspace = Path.cwd()
    out = S3Asset.from_context(context)

    context.instance.add_dynamic_partitions(
        project_partition.name,
        [out.project_id],
    )

    if out.exists():
        shutil.rmtree(out.path)
    out.path.mkdir(parents=True, exist_ok=True)

    project_id = context.partition_key

    for upload in config.uploads:
        s3_key = f"{project_id}/{upload.name}"
        path = s3.pull_file(workspace / upload.name, s3_key)
        context.log.info(f"Pulled file {upload.name}")

        video = Video(path)

        if upload.type == "num":
            frame_idxs = [
                int(i * video.num_frames / upload.num) for i in range(upload.num)
            ]
        elif upload.type == "list":
            frame_idxs = upload.frames

        extract_frames(video, frame_idxs, out.path)

    return out


@asset(partitions_def=project_partition)
def pairing(
    context: OpExecutionContext,
    config: PairingConfig,
    frames,
) -> S3Asset:
    out = S3Asset.from_context(context)
    pairs = out.path / "pairs.txt"

    if config.type == "exhaustive":
        command = f"pair_exhaustive.py -i {frames.path} -o {pairs}"
        execute_script(command, context)

    elif config.type == "complex":
        pair_files = []
        if config.sequential > 0:
            sequential_pairs = out.path / "sequential.txt"
            command = (
                f"pair_sequential.py -i {frames.path} "
                f"-o {sequential_pairs} -n {config.sequential}"
            )
            execute_script(command, context)
            pair_files.append(sequential_pairs)

        if config.retrieval > 0:
            features = out.path / "features.bin"
            retrieval_pairs = out.path.parent / "retrieval.txt"
            command = (
                f"pair_retrieval.py -i {frames.path} "
                f"-f {features} -p {retrieval_pairs} "
                f"-n {config.retrieval}"
            )
            execute_script(command, context)
            pair_files.append(retrieval_pairs)

        command = f"pair_merge.py -o {pairs} "
        command += " ".join(str(p) for p in pair_files)
        execute_script(command, context)

    return out


@asset(partitions_def=project_partition)
def feature_matching(
    context: OpExecutionContext,
    config: FeatureMatchingConfig,
    frames: S3Asset,
    pairing: S3Asset,
) -> S3Asset:
    out = S3Asset.from_context(context)

    command = (
        f"extract_features.py -i {frames.path} "
        f"-f {out.path}/features.h5 -c {config.feature_type}"
    )
    execute_script(command, context)

    command = (
        f"match_features.py -p {pairing.path} "
        f"-f {out.path}/features.h5 -m {out.path}/matches.h5 "
        f"-c {config.matcher} "
    )
    execute_script(command, context)

    return out


@asset(partitions_def=project_partition)
def colmap(
    context: OpExecutionContext,
    frames: S3Asset,
    pairing: S3Asset,
    feature_matching: S3Asset,
) -> S3Asset:
    out = S3Asset.from_context(context)

    command = (
        f"prepare_db.py -i {frames.path} -o {out.path} "
        f"-p {pairing.path} -f {feature_matching.path}/features.h5 "
        f"-m {feature_matching.path}/matches.h5 "
    )
    execute_script(command, context)

    execute_script(f"mapper.sh {frames.path} {out.path}", context)

    return out


@asset(partitions_def=project_partition)
def splat(
    context: OpExecutionContext,
    config: GaussianSplattingConfig,
    colmap: S3Asset,
) -> S3Asset:
    out = S3Asset.from_context(context)

    command = (
        f"gaussian_splatting_cuda -d {colmap.path}/colmap-pinhole "
        f"-o {out.path} -i {config.max_iter}"
    )
    execute_command_in_context(command, context)

    return out


assets = load_assets_from_current_module()

job = define_asset_job(
    name="analyse",
    selection=assets,
    partitions_def=project_partition,
)
