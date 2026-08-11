"""
PyTorch Dataset Loader & Data Augmentation Pipeline for Plant Disease Detection.
"""

from pathlib import Path
from typing import Dict, Tuple
from torch.utils.data import DataLoader
from torchvision import transforms
from torchvision.datasets import ImageFolder

# ImageNet normalization statistics
IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


def get_data_transforms(image_size: int = 224) -> Dict[str, transforms.Compose]:
    """Build data augmentation transforms for train, val, and test splits."""
    return {
        "train": transforms.Compose(
            [
                transforms.RandomResizedCrop(image_size, scale=(0.8, 1.0)),
                transforms.RandomHorizontalFlip(p=0.5),
                transforms.RandomVerticalFlip(p=0.3),
                transforms.RandomRotation(degrees=20),
                transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
                transforms.ToTensor(),
                transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ]
        ),
        "val": transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ]
        ),
        "test": transforms.Compose(
            [
                transforms.Resize((image_size, image_size)),
                transforms.ToTensor(),
                transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
            ]
        ),
    }


def create_dataloaders(
    data_dir: Path,
    image_size: int = 224,
    batch_size: int = 32,
    num_workers: int = 2,
) -> Tuple[Dict[str, DataLoader], Dict[int, str]]:
    """Create PyTorch DataLoaders and return class mapping dictionary."""
    data_transforms = get_data_transforms(image_size)
    dataloaders = {}
    class_to_idx = {}

    for split in ["train", "val", "test"]:
        split_path = data_dir / split
        if split_path.exists():
            dataset = ImageFolder(root=str(split_path), transform=data_transforms[split])
            shuffle = True if split == "train" else False
            dataloaders[split] = DataLoader(
                dataset,
                batch_size=batch_size,
                shuffle=shuffle,
                num_workers=num_workers,
                pin_memory=True,
            )
            if split == "train":
                class_to_idx = dataset.class_to_idx

    idx_to_class = {v: k for k, v in class_to_idx.items()}
    return dataloaders, idx_to_class
