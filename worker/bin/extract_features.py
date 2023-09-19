#!/usr/bin/env python3

import click
from pathlib import Path
from hloc.extract_features import confs, main as hloc_extract_features


@click.command()
@click.option("-i", "--images", type=click.Path(exists=True))
@click.option("-f", "--features", type=click.Path())
@click.option("-c", "--conf", type=str)
def extract_features(images, features, conf):
    config = confs[conf]
    hloc_extract_features(
        config,
        image_dir=Path(images),
        feature_path=Path(features),
    )


if __name__ == "__main__":
    extract_features()
