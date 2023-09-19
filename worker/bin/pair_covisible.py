#!/usr/bin/env python3

import click
from pathlib import Path
from hloc import pairs_from_covisibility


@click.command()
@click.option("-i", "--model", type=click.Path(exists=True))
@click.option("-o", "--output", type=click.Path(exists=True))
@click.option("-n", "--num_matched", type=int, default=5)
def pair_covisible(model, output, num_matched):
    covis_pairs = Path(output) / "covis_pairs.txt"
    pairs_from_covisibility.main(model, covis_pairs, num_matched=num_matched)


if __name__ == "__main__":
    pair_covisible()
