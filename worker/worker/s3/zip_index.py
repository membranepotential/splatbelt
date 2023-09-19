from dataclasses import dataclass
from bisect import bisect_left
import csv
import struct
from pathlib import Path
from zipfile import ZipFile, ZipInfo

struct_file_header = "<4s2B4HL2L2H"
size_file_header = struct.calcsize(struct_file_header)
size_extra = 28


@dataclass
class ZipIndexEntry:
    name: str
    header_offset: int = 0
    compress_size: int = 0

    def __post_init__(self):
        self.header_offset = int(self.header_offset)
        self.compress_size = int(self.compress_size)

    @staticmethod
    def read_header_size(fobj):
        fheader = struct.unpack(struct_file_header, fobj.read(size_file_header))
        return size_file_header + fheader[10] + fheader[11]

    @classmethod
    def from_zipinfo(cls, zipinfo: ZipInfo, prefix: str):
        name = zipinfo.filename
        if name.startswith(prefix):
            name = name[len(prefix) :]

        header_size = len(zipinfo.filename) + size_file_header + size_extra
        return cls(
            name=name,
            header_offset=zipinfo.header_offset + header_size,
            compress_size=zipinfo.compress_size,
        )

    def csv(self):
        return (self.name, str(self.header_offset), str(self.compress_size))

    @property
    def range_header(self):
        return (
            f"bytes={self.header_offset}-{self.header_offset + self.compress_size - 1}"
        )


@dataclass
class ZipIndex:
    entries: list[ZipIndexEntry]

    @staticmethod
    def list_zipinfos(path: Path):
        with ZipFile(path, "r") as f:
            entries = f.infolist()

        entries = [e for e in entries if not e.is_dir()]
        entries.sort(key=lambda x: x.filename)
        return entries

    @classmethod
    def read_archive(cls, path: Path):
        entries = cls.list_zipinfos(path)
        entries = [ZipIndexEntry.from_zipinfo(e, path.stem + "/") for e in entries]
        return cls(entries)

    @classmethod
    def load(cls, fpath: Path):
        with fpath.open() as f:
            reader = csv.reader(f)
            entries = [ZipIndexEntry(*row) for row in reader]
        return cls(entries)

    @classmethod
    def parse(cls, lines: list[str]):
        reader = csv.reader(lines)
        entries = [ZipIndexEntry(*row) for row in reader]
        return cls(entries)

    def find(self, name: str) -> ZipIndexEntry:
        names = [e.name for e in self.entries]
        i = bisect_left(names, name)
        if i != len(names) and names[i] == name:
            return self.entries[i]

        raise ValueError("Entry not found")

    def save(self, outpath: Path):
        with outpath.open("w") as f:
            writer = csv.writer(f)
            for entry in self.entries:
                writer.writerow(entry.csv())
                
    def __iter__(self):
        yield from (e.name for e in self.entries)
