from pathlib import Path

import click
import cv2

from worker.video import Video


def extract_frames(video: Video, frames: list[int], output_dir: Path) -> list[Path]:
    extracted = []
    for num in sorted(frames):
        video.seek(num)
        frame = video.read()
        path = output_dir / f"{video.path.stem}_{num:05d}.png"
        cv2.imwrite(str(path), frame)
        extracted.append(path)
    return extracted


@click.command()
@click.argument(
    "video_path",
    type=click.Path(file_okay=True, dir_okay=False, exists=True),
    required=True,
)
@click.argument(
    "output_dir",
    type=click.Path(file_okay=False),
    required=True,
)
@click.argument(
    "frames",
    type=click.File(),
    required=True,
)
def main(video_path: str, output_dir: str, frames):
    video = Video(video_path)

    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    frame_list = [int(line.strip()) for line in frames if line.strip().isdigit()]
    frame_list.sort()
    extract_frames(video, frame_list, output_dir)


if __name__ == "__main__":
    main()
