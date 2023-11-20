#!/usr/bin/env python3

import os
import json
import logging
from pathlib import Path
from subprocess import run
import click
import torch


class QuietTqdm:
    n = 0
    total = None
    disable = True

    def __init__(self, *args, **kwargs):
        pass

    def update(self, n):
        pass

    def set_description(self, *args, **kwargs):
        pass

    def write(self, s):
        pass

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args, **kwargs):
        pass


import torch.hub

torch.hub.tqdm = QuietTqdm


from hloc.extract_features import main as hloc_extract_features
from hloc.match_features import match_from_paths as hloc_match_features


def get_feature_config(feature_type: dict, out: Path):
    output = {"output": out.stem}

    if feature_type == "superpoint":
        return output | {
            "model": {"name": "superpoint", "nms_radius": 3, "max_keypoints": 4096},
            "preprocessing": {"grayscale": True, "resize_max": 1600},
        }
    elif feature_type == "disk":
        return output | {
            "model": {"name": "disk", "max_keypoints": 5000},
            "preprocessing": {"grayscale": False, "resize_max": 1600},
        }
    elif feature_type == "colmap":
        return output | {"model": {"name": "colmap"}}

    raise ValueError(
        f"Invalid feature type: {feature_type}. "
        f"Valid types: superpoint, disk, colmap"
    )


def get_matcher_config(config: dict, out: Path):
    output = {"output": out.stem}

    matcher = config["type"]
    feature_type = config["features"]

    if matcher == "lightglue":
        if feature_type not in {"superpoint", "disk"}:
            raise ValueError(
                f"Invalid feature type for lightglue: {feature_type}. "
                f"Valid types: superpoint, disk"
            )
        return output | {"model": {"name": "lightglue", "features": feature_type}}
    elif matcher == "superglue":
        return output | {
            "model": {
                "name": "superglue",
                "weights": config["weights"],
                "sinkhorn_iterations": config["iterations"],
            }
        }
    elif matcher == "colmap":
        if feature_type != "colmap":
            raise ValueError(
                f"Invalid feature type for colmap: {feature_type}. "
                f"Valid types: colmap"
            )
        return output | {"model": {"name": "colmap"}}

    raise ValueError(
        f"Invalid matcher: {matcher}. Valid matchers: lightglue, superglue, colmap"
    )


def colmap_extract_features(images: Path, database: Path):
    gpu = torch.cuda.is_available()
    cmd = [
        "colmap",
        "feature_extractor",
        "--database_path",
        str(database),
        "--image_path",
        str(images),
        "--ImageReader.single_camera",
        "1",
        "--ImageReader.camera_model",
        "OPENCV",
        "--SiftExtraction.use_gpu",
        str(int(gpu)),
    ]

    logging.debug("Running: %s", " ".join(cmd))
    run(cmd, check=True, capture_output=True)


def colmap_match_features(pairs: Path, database: Path):
    gpu = torch.cuda.is_available()
    cmd = [
        "colmap",
        "matches_importer",
        "--database_path",
        str(database),
        "--match_list_path",
        str(pairs),
        "--SiftMatching.use_gpu",
        str(int(gpu)),
    ]
    logging.debug("Running: %s", " ".join(cmd))
    run(cmd, check=True, capture_output=True)


@click.group()
def cli():
    os.environ["TQDM_DISABLE"] = "1"


@cli.command()
@click.option("-c", "--config", required=True)
@click.option("-i", "--images", type=click.Path(exists=True))
@click.option("-f", "--features", type=click.Path(), default="features.h5")
@click.option("-d", "--database", type=click.Path(), default="database.db")
def extract(config, images, features, database):
    images = Path(images)
    features = Path(features)
    database = Path(database)

    config = json.loads(config)
    try:
        feature_config = get_feature_config(config["matching"]["features"], features)
    except KeyError as e:
        raise ValueError(f"Invalid config: {e}")

    if feature_config["model"]["name"] == "colmap":
        logging.info("Extracting features with colmap")
        colmap_extract_features(images, database)
    else:
        logging.info("Extracting features with hloc")
        hloc_extract_features(feature_config, images, features.parent)

        logging.info("Writing images to database")
        run(
            ["database.py", "--overwrite", str(database), "import-images", str(images)],
            check=True,
        )

        logging.info("Writing features to database")
        run(
            ["database.py", str(database), "import-features", str(features)], check=True
        )


@cli.command()
@click.option("-c", "--config", required=True)
@click.option("-p", "--pairs", type=click.Path(exists=True))
@click.option("-f", "--features", type=click.Path(), default="features.h5")
@click.option("-m", "--matches", type=click.Path(), default="matches.h5")
@click.option("-d", "--database", type=click.Path(), default="database.db")
def match(config, pairs, features, matches, database):
    pairs = Path(pairs)
    features = Path(features)
    matches = Path(matches)

    config = json.loads(config)
    try:
        matcher_config = get_matcher_config(config["matching"], matches)
    except KeyError as e:
        raise ValueError(f"Invalid config: {e}")

    if matcher_config["model"]["name"] == "colmap":
        logging.info("Matching features with colmap")
        colmap_match_features(pairs, database)
    else:
        logging.info("Matching features with hloc")
        hloc_match_features(matcher_config, pairs, matches, features, features)

        min_match_score = config["matching"].get("minMatchScore", None)

        cmd = [
            "database.py",
            str(database),
            "import-matches",
            str(matches),
            "-p",
            str(pairs),
        ]
        if min_match_score is not None:
            cmd += ["--min-match-score", str(min_match_score)]

        run(cmd, check=True)


if __name__ == "__main__":
    cli()
