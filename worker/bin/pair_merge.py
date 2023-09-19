#!/usr/bin/env python3

import click
from hloc import logger


@click.command()
@click.option("-o", "--output", type=click.Path())
@click.argument("pair_paths", type=click.Path(exists=True), nargs=-1)
def pair_merge(output, pair_paths):
    pairs = set()
    for pair_path in pair_paths:
        with open(str(pair_path), "r") as f:
            pairs |= {tuple(p.split()) for p in f.readlines()}

    pairs = list(sorted(pairs))

    logger.info(f"Merged {len(pairs)} pairs.")

    with open(output, "w") as f:
        f.write("\n".join(" ".join([i, j]) for i, j in pairs))


if __name__ == "__main__":
    pair_merge()
