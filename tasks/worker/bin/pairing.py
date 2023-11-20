#!/usr/bin/env python3

import click
import json
from itertools import combinations
from pathlib import Path
from hloc import extract_features, pairs_from_retrieval


def pair_exhaustive(images):
    return combinations(images, r=2)


def pair_sequential(images, num):
    pairs = []
    for i in range(1, num + 1):
        pairs.extend(list(zip(images, images[i:])))
    return pairs


def pair_retrieval(images: str, out_features: str, out_pairs: str, num_matched: int):
    retrieval_conf = extract_features.confs["netvlad"]
    retrieval_path = extract_features.main(
        retrieval_conf, Path(images), Path(out_features)
    )
    pairs_from_retrieval.main(retrieval_path, out_pairs, num_matched=num_matched)


def pair_merge(pair_paths):
    pairs = set()
    for pair_path in pair_paths:
        pair_path = Path(pair_path)
        if pair_path.exists():
            with pair_path.open() as f:
                pairs |= {tuple(p.split()) for p in f.readlines()}

    return list(sorted(pairs))


def write_pairs(pairs, output):
    with open(output, "w") as f:
        f.write("\n".join(" ".join([i, j]) for i, j in pairs))


@click.command()
@click.option("-i", "--image_dir", type=click.Path(exists=True))
@click.option("-c", "--config", type=str)
@click.option("-o", "--output", type=click.Path())
def pairing(image_dir, config, output):
    images = [p.name for p in Path(image_dir).iterdir()]
    images.sort()

    config = json.loads(config)
    pairing_type = config["type"]

    if pairing_type == "exhaustive":
        pairs = pair_exhaustive(images)
        write_pairs(pairs, output)

    elif pairing_type == "complex":
        num_seq = config.get("sequential", 0)
        if num_seq:
            seq_pairs = pair_sequential(images, num_seq)
            write_pairs(seq_pairs, "seq_pairs.txt")

        num_retr = config.get("retrieval", 0)
        if num_retr:
            pair_retrieval(
                image_dir,
                "retrieval.h5",
                "retr_pairs.txt",
                config.get("retrieval", 0),
            )

        pairs = pair_merge(["seq_pairs.txt", "retr_pairs.txt"])
        write_pairs(pairs, output)

    else:
        raise ValueError(f"Unknown pairing type: {pairing_type}")


if __name__ == "__main__":
    pairing()
