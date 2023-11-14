#!/usr/bin/env python3

import json
from pathlib import Path
from mimetypes import guess_type
from typing import Any
import logging
import click
import numpy as np
import cv2


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

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def handle_upload(upload: Path, config: dict[str, Any], outdir: Path):
    filetype = guess_type(upload)
    if filetype == "image":
        handle_image(upload, outdir)
    elif filetype == "video":
        handle_video(upload, config, outdir)
    else:
        logging.error(
            "Error processing %s: Unsupported filetype %s",
            upload.name,
            filetype,
        )


def handle_image(upload: Path, outdir: Path):
    upload.rename(outdir / upload.name)


def handle_video(upload: Path, conf: list[str], outdir: Path):
    with Video(upload) as video:
        ex_type = conf[0]
        if ex_type == "num":
            num = int(conf[1])
            frame_idxs = [int(i * video.num_frames / num) for i in range(num)]
        elif ex_type == "list":
            frame_idxs = [int(i) for i in conf[1:]]
        else:
            logging.error(
                "Error processing %s: Unknown extraction type %s",
                upload.name,
                ex_type,
            )

        video.extract_frames(frame_idxs, outdir)


@click.command()
@click.option("--outdir", "-o", required=True)
@click.option("--frames", "-f", required=True)
@click.option("--uploads", "-u", default="./uploads")
def main(outdir, frames, uploads):
    uploads = Path(uploads)

    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    for name, config in json.loads(frames).items():
        upload = uploads / name
        if upload.is_file():
            logging.info("Processing %s", name)
            handle_upload(upload, config, outdir)
        else:
            logging.error("Could not process %s", name)


if __name__ == "__main__":
    main()
