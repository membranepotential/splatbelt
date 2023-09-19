from typing import Any
from pydantic import Field
from dagster import Config


class FrameSelection(Config):
    name: str
    type: str
    num: int | None = None
    frames: list[int] | None = None


class FrameConfig(Config):
    uploads: list[FrameSelection]


class CovisibleConfig(Config):
    num: int
    model: str


class PairingConfig(Config):
    type: str
    sequential: int = 0
    retrieval: int = 0
    covisible: CovisibleConfig | None = None


class FeatureMatchingConfig(Config):
    feature_type: str
    matcher: str


class GaussianSplattingConfig(Config):
    max_iter: int
