#!/usr/bin/env python3
"""
Plant Disease Detection System - Dataset Downloader
===================================================
Automates downloading and extraction of the PlantVillage 38-class leaf disease dataset.
Supports execution locally or within Google Colab cloud environment.
"""

import argparse
import os
import shutil
import sys
import urllib.request
import zipfile
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


# Open-access PlantVillage mirror dataset archive URL
DEFAULT_DATASET_URL = (
    "https://github.com/spMohanty/PlantVillage-Dataset/archive/refs/heads/master.zip"
)
KAGGLE_DATASET_HANDLE = "abdallahalmamun/plantvillage-dataset"


def download_with_progress(url: str, output_path: Path):
    """Download a file with console progress indicator."""
    print(f"📥 Downloading dataset from: {url}")
    print(f"💾 Saving to: {output_path}")

    def _progress(count, block_size, total_size):
        percent = int(count * block_size * 100 / total_size) if total_size > 0 else 0
        mb_downloaded = (count * block_size) / (1024 * 1024)
        total_mb = total_size / (1024 * 1024) if total_size > 0 else 0
        sys.stdout.write(
            f"\r progress: {percent}% [{mb_downloaded:.1f} MB / {total_mb:.1f} MB]"
        )
        sys.stdout.flush()

    urllib.request.urlretrieve(url, output_path, reporthook=_progress)
    print("\n✅ Download complete!")


def download_via_kagglehub(output_dir: Path):
    """Attempt download using kagglehub if available."""
    try:
        import kagglehub

        print(f"📥 Downloading via kagglehub ({KAGGLE_DATASET_HANDLE})...")
        path = kagglehub.dataset_download(KAGGLE_DATASET_HANDLE)
        print(f"✅ Kagglehub download path: {path}")

        # Copy or symlink to output_dir
        dest = output_dir / "plantvillage"
        dest.mkdir(parents=True, exist_ok=True)
        for item in Path(path).glob("*"):
            if item.is_dir():
                shutil.copytree(item, dest / item.name, dirs_exist_ok=True)
            else:
                shutil.copy2(item, dest / item.name)
        return True
    except Exception as e:
        print(f"⚠️ Kagglehub download skipped ({e}). Falling back to HTTP archive...")
        return False


def extract_archive(zip_path: Path, extract_to: Path):
    """Extract zip archive into target directory."""
    print(f"📦 Extracting {zip_path.name} to {extract_to}...")
    extract_to.mkdir(parents=True, exist_ok=True)

    with zipfile.ZipFile(zip_path, "r") as zip_ref:
        zip_ref.extractall(extract_to)
    print("✅ Extraction complete!")


def organize_plantvillage_folder(raw_dir: Path):
    """
    Ensure uniform raw/plantvillage structure containing disease class directories.
    Handles nested directory structure from extracted GitHub master zip if present.
    """
    target_dir = raw_dir / "plantvillage"
    target_dir.mkdir(parents=True, exist_ok=True)

    # Check for nested spMohanty zip extraction path
    nested_color = list(raw_dir.glob("**/raw/color"))
    nested_segmented = list(raw_dir.glob("**/raw/segmented"))

    source_dir = None
    if nested_color:
        source_dir = nested_color[0]
    elif nested_segmented:
        source_dir = nested_segmented[0]

    if source_dir and source_dir.exists():
        print(f"📁 Organizing class folders from {source_dir}...")
        for class_folder in source_dir.iterdir():
            if class_folder.is_dir():
                dest_class = target_dir / class_folder.name
                if not dest_class.exists():
                    shutil.move(str(class_folder), str(dest_class))
        print(f"✅ Organised class directories into: {target_dir}")

    # Count classes
    class_count = len([d for d in target_dir.iterdir() if d.is_dir()])
    print(f"🌿 Total disease classes found in {target_dir}: {class_count}")
    return class_count


def main():
    parser = argparse.ArgumentParser(
        description="Download PlantVillage Leaf Disease Dataset"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="data/raw",
        help="Directory to save raw dataset",
    )
    parser.add_argument(
        "--source",
        type=str,
        choices=["auto", "http", "kaggle"],
        default="auto",
        help="Download source method",
    )
    args = parser.parse_args()

    raw_dir = Path(args.output_dir).resolve()
    raw_dir.mkdir(parents=True, exist_ok=True)
    zip_path = raw_dir / "plantvillage_dataset.zip"

    download_success = False

    if args.source in ["auto", "kaggle"]:
        download_success = download_via_kagglehub(raw_dir)

    if not download_success:
        try:
            download_with_progress(DEFAULT_DATASET_URL, zip_path)
            extract_archive(zip_path, raw_dir)
            if zip_path.exists():
                os.remove(zip_path)  # cleanup zip file
            download_success = True
        except Exception as e:
            print(f"❌ Error downloading dataset: {e}")
            sys.exit(1)

    organize_plantvillage_folder(raw_dir)
    print(f"🎉 Dataset ready! Located at: {raw_dir / 'plantvillage'}")


if __name__ == "__main__":
    main()
