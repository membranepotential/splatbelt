#!/usr/bin/env python3

import click

from hloc import extract_features, pairs_from_retrieval


@click.command()
@click.option("-i", "--images", type=click.Path(exists=True))
@click.option("-f", "--out-features", type=click.Path())
@click.option("-p", "--out-pairs", type=click.Path())
@click.option("-n", "--num_matched", type=int, default=8)
def pair_retrieval(images: str, out_features: str, out_pairs: str, num_matched: int):
    retrieval_conf = extract_features.confs["netvlad"]
    retrieval_path = extract_features.main(retrieval_conf, images, out_features)
    pairs_from_retrieval.main(retrieval_path, out_pairs, num_matched=num_matched)


if __name__ == "__main__":
    pair_retrieval()
