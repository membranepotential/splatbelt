#!/usr/bin/env python3

import json
import os
import sys

import click
import pycolmap
from pycolmap import CameraMode

from hloc.utils.database import COLMAPDatabase
from hloc.utils.io import get_keypoints, get_matches


def init_database(db: COLMAPDatabase) -> COLMAPDatabase:
    db.create_tables()
    db.commit()


def get_image_ids(db: COLMAPDatabase) -> dict[str, int]:
    return dict(db.execute("SELECT name, image_id FROM images;"))


@click.group()
@click.argument("database", type=click.Path(), default="database.db")
@click.option("-w", "--overwrite", is_flag=True, default=False)
@click.pass_context
def cli(ctx, database, overwrite):
    ctx.ensure_object(dict)
    ctx.obj["database"] = database

    exists = os.path.exists(database)
    if exists and overwrite:
        os.remove(database)
        exists = False

    conn = COLMAPDatabase.connect(database)
    if not exists:
        init_database(conn)

    ctx.obj["conn"] = conn


@cli.command()
@click.argument("images", type=click.Path(exists=True), required=True)
@click.option("--image-list", default=None, help="Path to image list or '-' for stdin")
@click.option("--options", default=None)
@click.pass_obj
def import_images(obj, images, image_list, options):
    if image_list is None:
        image_list = []
    elif image_list == "-":
        image_list = [line.strip() for line in sys.stdin.readlines()]
    else:
        with open(image_list) as f:
            image_list = [line.strip() for line in f.readlines()]

    if options is None:
        options = {}
    else:
        options = json.loads(options)

    if not os.listdir(images):
        raise IOError(f"No images found in {images}.")

    with pycolmap.ostream():
        pycolmap.import_images(
            obj["database"],
            images,
            CameraMode.SINGLE,
            image_list=image_list,
            options=options,
        )


@cli.command()
@click.argument("features", type=click.Path(exists=True), required=True)
@click.pass_obj
def import_features(obj, features):
    db = obj["conn"]
    image_ids = get_image_ids(db)
    for image_name, image_id in image_ids.items():
        keypoints = get_keypoints(features, image_name)
        keypoints += 0.5  # COLMAP origin
        db.add_keypoints(image_id, keypoints)
    db.commit()


@cli.command()
@click.argument("match_file", type=click.Path(exists=True), required=True)
@click.option("-p", "--pairs", type=click.Path(exists=True), required=True)
@click.option("-nogv", "--skip-geometric-verification", is_flag=True, default=False)
@click.option("-ms", "--min-match-score", type=float, default=None)
@click.pass_obj
def import_matches(
    obj, match_file, pairs, skip_geometric_verification, min_match_score
):
    db = obj["conn"]

    with open(pairs) as f:
        img_pairs = [p.split() for p in f.readlines()]

    image_ids = get_image_ids(db)

    matched = set()
    for name0, name1 in img_pairs:
        id0, id1 = image_ids[name0], image_ids[name1]
        if len({(id0, id1), (id1, id0)} & matched) > 0:
            continue

        matches, scores = get_matches(match_file, name0, name1)
        if min_match_score:
            matches = matches[scores > min_match_score]

        db.add_matches(id0, id1, matches)
        matched |= {(id0, id1), (id1, id0)}

        if skip_geometric_verification:
            db.add_two_view_geometry(id0, id1, matches)

    db.commit()

    if not skip_geometric_verification:
        with pycolmap.ostream():
            pycolmap.verify_matches(
                obj["database"],
                pairs,
                max_num_trials=20000,
                min_inlier_ratio=0.1,
            )


if __name__ == "__main__":
    cli()
