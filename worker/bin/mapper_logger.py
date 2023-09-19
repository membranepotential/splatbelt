#!/usr/bin/env python3

import sys
from tqdm.auto import tqdm

print("logger started")

load_msg = "Loading images... "
register_msg = "Registering image "

with tqdm(desc="Mapping") as pbar:
    for line in sys.stdin:
        if line.startswith(load_msg):
            total = int(line[len(load_msg) :].strip().split()[0])
            pbar.total = total
        elif line.startswith(register_msg):
            n = line[len(register_msg) :].strip().split()[1]
            n = int(n[1:-1])
            pbar.update(n - pbar.n)
