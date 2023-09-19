#!/usr/bin/env python3

import click
from itertools import combinations
from pathlib import Path


@click.command()
@click.option("-i", "--images", type=click.Path(exists=True))
@click.option("-o", "--output", type=click.Path())
def pair_exhaustive(images, output):
    images = [p.name for p in Path(images).iterdir()]
    pairs = combinations(images, r=2)
    with open(output, "w") as f:
        f.write("\n".join(" ".join([i, j]) for i, j in pairs))


if __name__ == "__main__":
    pair_exhaustive()
