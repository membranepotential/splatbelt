#!/usr/bin/env python3

import click
from pathlib import Path
from hloc import logger


@click.command()
@click.option("-i", "--images", type=click.Path(exists=True))
@click.option("-o", "--output", type=click.Path())
@click.option("-n", "--num", type=int, default=5)
def pair_sequential(images, output, num):
    images = [p.name for p in Path(images).iterdir()]

    pairs = []
    for i in range(1, num + 1):
        pairs.extend(list(zip(images, images[i:])))

    logger.info(f"Found {len(pairs)} pairs.")

    with open(output, "w") as f:
        f.write("\n".join(" ".join([i, j]) for i, j in pairs))


if __name__ == "__main__":
    pair_sequential()
