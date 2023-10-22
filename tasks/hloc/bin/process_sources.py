#!/usr/bin/env python3

import os
from pathlib import Path
from mimetypes import guess_type
from typing import Any
import boto3
import click
import numpy as np
import cv2

BUCKET = os.environ["S3_BUCKET"]


class Video:
    def __init__(self, path: str | Path):
        self.path = Path(path)
        self.cap = cv2.VideoCapture(str(path))

    def seek(self, frame: int) -> bool:
        return self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame)

    def read(self) -> np.ndarray:
        ret, frame = self.cap.read()
        if not ret:
            raise ValueError("Failed to read frame")
        return frame

    @property
    def fps(self) -> float:
        return self.cap.get(cv2.CAP_PROP_FPS)

    @property
    def num_frames(self) -> int:
        return int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))

    @property
    def width(self) -> int:
        return int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))

    @property
    def height(self) -> int:
        return int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

    def get_infos(self) -> dict[str, Any]:
        return {
            "fps": self.fps,
            "numFrames": self.num_frames,
            "width": self.width,
            "height": self.height,
        }

    def extract_frames(self, frames: list[int], output_dir: Path) -> list[Path]:
        extracted = []
        for num in sorted(frames):
            self.seek(num)
            frame = self.read()
            path = output_dir / f"{self.path.stem}_{num:05d}.png"
            cv2.imwrite(str(path), frame)
            extracted.append(path)
        return extracted

    def close(self):
        self.cap.release()


def get_s3_client():
    endpoint = os.environ.get("S3_ENDPOINT", "")
    if endpoint:
        return boto3.client("s3", endpoint_url=endpoint)
    else:
        region = os.environ["AWS_REGION"]
        return boto3.client("s3", region_name=region)


def handle_source(source: str, project_id: str, outdir: Path, client):
    name, *conf = source.split(",")
    name = name.strip()

    filetype = guess_type(name)[0].split("/")[0]
    if filetype == "image":
        handle_image(name, project_id, outdir, client)
    elif filetype == "video":
        handle_video(name, conf, project_id, outdir, client)
    else:
        print(f"Skip source {name} - unsupported filetype {filetype}")


def handle_image(name: str, project_id: str, outdir: Path, client):
    key = project_id + "/" + name
    dst = str(outdir / name)
    client.download_file(BUCKET, key, dst)
    print("Downloaded image", name)


def handle_video(name: str, conf: list[str], project_id: str, outdir: Path, client):
    key = project_id + "/" + name
    client.download_file(BUCKET, key, name)
    print(f"Downloaded video {name}")

    video = Video(name)

    ex_type = conf[0]
    if ex_type == "num":
        num = int(conf[1])
        frame_idxs = [int(i * video.num_frames / num) for i in range(num)]
    elif ex_type == "list":
        frame_idxs = [int(i) for i in conf[1:]]
    else:
        raise ValueError(f"Unknown extraction type {ex_type}")

    video.extract_frames(frame_idxs, outdir)
    print(f"Extracted frames from video {name}")

    video.close()
    os.unlink(name)


@click.command()
@click.option("--project-id", "-p", required=True)
@click.option("--sources", "-s", required=True)
@click.option("--outdir", "-o", required=True)
def main(project_id, sources, outdir):
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    client = get_s3_client()

    for source in sources.split(";"):
        handle_source(source, project_id, outdir, client)


if __name__ == "__main__":
    main()
