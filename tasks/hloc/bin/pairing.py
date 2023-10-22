#!/usr/bin/env python3

import click
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
    retrieval_path = extract_features.main(retrieval_conf, images, out_features)
    pairs_from_retrieval.main(retrieval_path, out_pairs, num_matched=num_matched)


def pair_merge(pair_paths):
    pairs = set()
    for pair_path in pair_paths:
        with open(str(pair_path), "r") as f:
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
    
    pairing_type, *args = config.split(":", maxsplit=1)

    if pairing_type == "exhaustive":
        pairs = pair_exhaustive(images)

    elif pairing_type == "complex":
        nums = {k: int(v) for k, v in map(str.split("="), args.split(","))}
                
        seq_pairs = pair_sequential(images, nums.get("seq", 0))
        write_pairs(seq_pairs, "seq_pairs.txt")
        
        pair_retrieval(image_dir, "retrieval.h5", "retr_pairs.txt", nums.get("ret", 0))
        
        pairs = pair_merge(["seq_pairs.txt", "retr_pairs.txt"])
    
    else:
        raise ValueError(f"Unknown pairing type: {pairing_type}")
    
    write_pairs(pairs, output)


if __name__ == "__main__":
    pairing()