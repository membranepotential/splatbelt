from pathlib import Path
from typing import Any

import numpy as np

try:
    import cv2
except ImportError:
    pass


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

    def __del__(self):
        self.cap.release()


def fps_to_frames(video: Video, fps: float) -> list[int]:
    stride = video.fps / fps
    num = int(video.num_frames / stride)
    return [int(i * stride) for i in range(num)]


def extract_frames(video: Video, frames: list[int], output_dir: Path) -> list[Path]:
    extracted = []
    for num in sorted(frames):
        video.seek(num)
        frame = video.read()
        path = output_dir / f"{video.path.stem}_{num:05d}.png"
        cv2.imwrite(str(path), frame)
        extracted.append(path)
    return extracted
