#!/usr/bin/env python3
"""
Plant Disease Detection System - Dataset Preprocessing & Cleaning Engine
===========================================================================
- Filters corrupt/unreadable images.
- Resizes images to standard 224x224 RGB format.
- Splits dataset per class: 80% Train / 10% Validation / 10% Test.
- Generates dataset_summary.json metric report.
"""

import os
import sys
import json
import random
import argparse
from pathlib import Path
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass


def is_valid_image(filepath: Path) -> bool:
    """Check if image file is non-empty and readable by Pillow."""
    if not filepath.is_file() or filepath.stat().st_size == 0:
        return False
    try:
        with Image.open(filepath) as img:
            img.verify()
        return True
    except Exception:
        return False

def process_and_save_image(src_path: Path, dst_path: Path, target_size=(224, 224)):
    """Resize image to target_size RGB and save as JPEG."""
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(src_path) as img:
        img_rgb = img.convert("RGB")
        img_resized = img_rgb.resize(target_size, Image.Resampling.LANCZOS)
        img_resized.save(dst_path, "JPEG", quality=90)

def main():
    parser = argparse.ArgumentParser(description="Preprocess and split PlantVillage dataset")
    parser.add_argument("--raw-dir", type=str, default="data/raw/plantvillage", help="Directory containing raw class folders")
    parser.add_argument("--output-dir", type=str, default="data/processed", help="Directory for processed train/val/test splits")
    parser.add_argument("--train-ratio", type=float, default=0.8, help="Ratio for training set")
    parser.add_argument("--val-ratio", type=float, default=0.1, help="Ratio for validation set")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for split reproducibility")
    args = parser.parse_args()

    random.seed(args.seed)
    raw_dir = Path(args.raw_dir).resolve()
    output_dir = Path(args.output_dir).resolve()

    if not raw_dir.exists():
        print(f"❌ Raw dataset directory does not exist: {raw_dir}")
        print("💡 Run 'python scripts/dataset_downloader.py' first!")
        sys.exit(1)

    class_dirs = [d for d in raw_dir.iterdir() if d.is_dir()]
    if not class_dirs:
        print(f"❌ No class subdirectories found in {raw_dir}")
        sys.exit(1)

    print(f"🔍 Found {len(class_dirs)} disease classes in {raw_dir.name}")
    print(f"⚙️ Preprocessing (Resizing to 224x224 RGB, Splitting 80/10/10)...")

    stats = {
        "total_classes": len(class_dirs),
        "total_images": 0,
        "corrupted_removed": 0,
        "train_count": 0,
        "val_count": 0,
        "test_count": 0,
        "class_distribution": {},
        "target_size": [224, 224, 3]
    }

    for idx, class_dir in enumerate(class_dirs, 1):
        class_name = class_dir.name
        image_files = [f for f in class_dir.glob("*") if f.suffix.lower() in [".jpg", ".jpeg", ".png", ".bmp", ".webp"]]
        
        valid_files = []
        for img_file in image_files:
            if is_valid_image(img_file):
                valid_files.append(img_file)
            else:
                stats["corrupted_removed"] += 1

        random.shuffle(valid_files)
        total_valid = len(valid_files)

        train_end = int(total_valid * args.train_ratio)
        val_end = train_end + int(total_valid * args.val_ratio)

        train_files = valid_files[:train_end]
        val_files = valid_files[train_end:val_end]
        test_files = valid_files[val_end:]

        # Process and save images into split folders
        splits = [("train", train_files), ("val", val_files), ("test", test_files)]
        for split_name, file_list in splits:
            for f in file_list:
                dst = output_dir / split_name / class_name / f"{f.stem}.jpg"
                process_and_save_image(f, dst)

        stats["train_count"] += len(train_files)
        stats["val_count"] += len(val_files)
        stats["test_count"] += len(test_files)
        stats["total_images"] += total_valid

        stats["class_distribution"][class_name] = {
            "total": total_valid,
            "train": len(train_files),
            "val": len(val_files),
            "test": len(test_files)
        }

        print(f" [{idx}/{len(class_dirs)}] Processed {class_name}: {total_valid} images (Train: {len(train_files)}, Val: {len(val_files)}, Test: {len(test_files)})")

    # Save summary report
    summary_path = output_dir / "dataset_summary.json"
    with open(summary_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2)

    print("\n" + "="*60)
    print("🎉 Dataset Preprocessing Complete!")
    print(f" Total Processed Images : {stats['total_images']}")
    print(f" Corrupted Removed       : {stats['corrupted_removed']}")
    print(f" Train Split Count       : {stats['train_count']}")
    print(f" Val Split Count         : {stats['val_count']}")
    print(f" Test Split Count        : {stats['test_count']}")
    print(f" Report Saved To         : {summary_path}")
    print("="*60)

if __name__ == "__main__":
    main()
