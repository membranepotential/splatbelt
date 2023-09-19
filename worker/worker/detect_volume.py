from pathlib import Path
import open3d as o3d
import open3d.core as o3c
from open3d.t.geometry import PointCloud
from hdbscan.flat import HDBSCAN_flat
import numpy as np


def read_point_cloud(
    path: Path,
    outlier_nb_points=200,
    outlier_search_radius=0.1,
    voxel_size=0.001,
) -> PointCloud:
    pcd = o3d.t.io.read_point_cloud(path)
    pcd, _ = pcd.remove_duplicated_points()
    pcd, _ = pcd.remove_radius_outliers(
        nb_points=outlier_nb_points,
        search_radius=outlier_search_radius,
    )
    pcd = pcd.voxel_down_sample(voxel_size=voxel_size)
    return pcd


def cluster_points(pcd: PointCloud, min_cluster_size=2000, min_samples=100):
    flat_clusterer = HDBSCAN_flat(
        pcd.point.positions.numpy(),
        n_clusters=2,
        min_cluster_size=min_cluster_size,
        min_samples=min_samples,
    )
    labels = flat_clusterer.labels_
    return labels


def detect_foreground_background(pcd: PointCloud, labels):
    points = pcd.select_by_mask(labels >= 0).point.positions.numpy()
    labels = labels[labels >= 0]

    centroid = points.mean(axis=0)
    dists = [
        np.median(np.linalg.norm(points[labels == i] - centroid, axis=1))
        for i in range(2)
    ]
    fg_label, bg_label = np.argsort(dists)
    points_fg = points[labels == fg_label]
    points_bg = points[labels == bg_label]
    return points_fg, points_bg


def detect_volume(pcd: PointCloud):
    labels = cluster_points(pcd)
    points_fg, points_bg = detect_foreground_background(pcd, labels)
