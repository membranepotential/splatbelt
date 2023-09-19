#!/usr/bin/env python3

import click
from pathlib import Path
from hloc.match_features import confs, match_from_paths


@click.command()
@click.option("-p", "--pairs", type=click.Path(exists=True))
@click.option("-f", "--features", type=click.Path(exists=True))
@click.option("-m", "--matches", type=click.Path())
@click.option("-c", "--conf", type=str)
def match_features(pairs, features, matches, conf):
    config = confs[conf]
    match_from_paths(config, Path(pairs), Path(matches), Path(features), Path(features))


if __name__ == "__main__":
    match_features()
