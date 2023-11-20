#!/usr/bin/env python3

from pathlib import Path
import shutil
import click
from pycolmap import Reconstruction


@click.command()
@click.argument("models", type=click.Path(exists=True), required=True)
@click.option("-i", "--images", type=click.Path(exists=True), default=None)
def cli(models, images):
    models = [model for model in Path(models).iterdir() if model.is_dir()]

    if not models:
        raise ValueError(f"No models found at {models}")

    counts: dict[Path, int] = {
        model: Reconstruction(model).num_reg_images() for model in models
    }
    largest: Path = max(counts, key=counts.get)

    if images is not None:
        n_images = sum(1 for _ in Path(images).iterdir())
        print(f"Input {n_images} images")

    n_matched = sum(counts.values())
    print(f"Matched {n_matched} images")

    n_registered = counts[largest]
    print(f"Registered {n_registered} ({n_registered / n_matched:.1%}) images")

    if len(models) >= 1:
        for model in set(counts) - {largest}:
            shutil.rmtree(model)

        largest.rename(largest.parent / "0")


if __name__ == "__main__":
    cli()
