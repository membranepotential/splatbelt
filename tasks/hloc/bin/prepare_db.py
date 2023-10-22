#!/usr/bin/env python3

import click
from pathlib import Path

from pycolmap import CameraMode, Reconstruction
from hloc.reconstruction import (
    create_empty_db,
    import_images,
    import_features,
    import_matches,
    get_image_ids,
    estimation_and_geometric_verification,
)


@click.command()
@click.option("-i", "--images", type=click.Path(exists=True), required=True)
@click.option("-p", "--pairs", type=click.Path(exists=True), required=True)
@click.option("-f", "--features", type=click.Path(exists=True), required=True)
@click.option("-m", "--matches", type=click.Path(exists=True), required=True)
@click.option("-o", "--outdir", type=click.Path(), default="colmap")
@click.option("-nogv", "--skip-geometric-verification", is_flag=True, default=False)
@click.option("-ms", "--min-match-score", type=float, default=None)
def prepare_database(
    images: Path,
    pairs: Path,
    features: Path,
    matches: Path,
    outdir: Path,
    skip_geometric_verification: bool,
    min_match_score: None | float,
) -> Reconstruction:
    outdir = Path(outdir)
    outdir.mkdir(parents=True, exist_ok=True)

    database = outdir / "database.db"
    create_empty_db(database)

    import_images(Path(images), database, CameraMode.SINGLE)
    image_ids = get_image_ids(database)
    import_features(image_ids, database, features)
    import_matches(
        image_ids,
        database,
        pairs,
        matches,
        min_match_score,
        skip_geometric_verification,
    )

    if not skip_geometric_verification:
        estimation_and_geometric_verification(database, pairs)


if __name__ == "__main__":
    prepare_database()
