"""
PyTorch Deep Learning Model Training Pipeline for Plant Disease Detection.
Tracks Accuracy, Loss, Precision, Recall, and F1-Score per epoch.
Saves best_model.pth checkpoint when validation F1-score improves.
"""

import argparse
import json
import os
import sys
import time
from pathlib import Path
import yaml

import torch
import torch.nn as nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR

# Add project root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.dataset import create_dataloaders
from ml.models.leaf_classifier import LeafClassifier



if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


def calculate_metrics(preds: torch.Tensor, targets: torch.Tensor, num_classes: int = 38):
    """Calculate accuracy, precision, recall, and macro F1-score."""
    correct = (preds == targets).sum().item()
    total = targets.size(0)
    acc = correct / total if total > 0 else 0.0

    # Macro F1 calculation across classes
    f1_scores = []
    for c in range(num_classes):
        tp = ((preds == c) & (targets == c)).sum().item()
        fp = ((preds == c) & (targets != c)).sum().item()
        fn = ((preds != c) & (targets == c)).sum().item()
        precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0
        f1_scores.append(f1)

    macro_f1 = sum(f1_scores) / len(f1_scores) if f1_scores else 0.0
    return acc, macro_f1


def train_model(
    config_path: str = "ml/config.yaml",
    epochs_override: int = None,
    dry_run: bool = False,
):
    """Train PyTorch classification model using hyperparameters in config_path."""
    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🚀 Training Device: {device}")

    num_classes = cfg["model"]["num_classes"]
    epochs = epochs_override if epochs_override is not None else cfg["training"]["epochs"]
    checkpoint_dir = Path(cfg["training"]["checkpoint_dir"])
    checkpoint_dir.mkdir(parents=True, exist_ok=True)

    model = LeafClassifier(
        num_classes=num_classes,
        model_name=cfg["model"]["name"],
        pretrained=cfg["model"]["pretrained"],
        dropout_rate=cfg["model"]["dropout_rate"],
        hidden_dim=cfg["model"]["hidden_dim"],
    ).to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=cfg["training"]["label_smoothing"])
    optimizer = AdamW(
        model.parameters(),
        lr=cfg["training"]["learning_rate"],
        weight_decay=cfg["training"]["weight_decay"],
    )
    scheduler = CosineAnnealingLR(optimizer, T_max=epochs)

    if dry_run:
        print("⚡ Dry-run execution verified! Model initialized cleanly.")
        return model, {"dry_run": True}

    data_dir = Path("data/processed")
    if not (data_dir / "train").exists():
        print(f"❌ Processed dataset not found at {data_dir}")
        print("💡 Run dataset downloader script or Google Colab notebook first!")
        sys.exit(1)

    dataloaders, idx_to_class = create_dataloaders(
        data_dir,
        image_size=cfg["dataset"]["image_size"],
        batch_size=cfg["dataset"]["batch_size"],
        num_workers=cfg["dataset"]["num_workers"],
    )

    best_val_f1 = 0.0
    history = {"train_loss": [], "val_loss": [], "val_acc": [], "val_f1": []}

    print(f"🏋️ Starting PyTorch Training for {epochs} Epochs...")
    start_time = time.time()

    for epoch in range(1, epochs + 1):
        # Training Phase
        model.train()
        running_loss = 0.0
        for images, labels in dataloaders["train"]:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            running_loss += loss.item() * images.size(0)

        scheduler.step()
        train_loss = running_loss / len(dataloaders["train"].dataset)

        # Validation Phase
        model.eval()
        val_loss = 0.0
        all_preds = []
        all_labels = []
        with torch.no_grad():
            for images, labels in dataloaders["val"]:
                images, labels = images.to(device), labels.to(device)
                outputs = model(images)
                loss = criterion(outputs, labels)
                val_loss += loss.item() * images.size(0)
                preds = torch.argmax(outputs, dim=1)
                all_preds.append(preds.cpu())
                all_labels.append(labels.cpu())

        val_loss = val_loss / len(dataloaders["val"].dataset)
        all_preds = torch.cat(all_preds)
        all_labels = torch.cat(all_labels)
        val_acc, val_f1 = calculate_metrics(all_preds, all_labels, num_classes)

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        history["val_f1"].append(val_f1)

        print(
            f"Epoch [{epoch:02d}/{epochs:02d}] - "
            f"Train Loss: {train_loss:.4f} | Val Loss: {val_loss:.4f} | "
            f"Val Acc: {val_acc*100:.2f}% | Val F1: {val_f1:.4f}"
        )

        # Save Best Checkpoint
        if val_f1 > best_val_f1:
            best_val_f1 = val_f1
            checkpoint_path = checkpoint_dir / cfg["training"]["model_filename"]
            torch.save(
                {
                    "epoch": epoch,
                    "model_state_dict": model.state_dict(),
                    "optimizer_state_dict": optimizer.state_dict(),
                    "val_f1": val_f1,
                    "idx_to_class": idx_to_class,
                },
                checkpoint_path,
            )
            print(f"  💾 Saved new best model checkpoint: {checkpoint_path} (Val F1: {val_f1:.4f})")

    elapsed = time.time() - start_time
    print(f"\n🎉 Training Complete in {elapsed/60:.2f} minutes! Best Val F1: {best_val_f1:.4f}")

    # Save training history JSON
    history_path = checkpoint_dir / "training_history.json"
    with open(history_path, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    return model, history


def main():
    parser = argparse.ArgumentParser(description="Train PyTorch Plant Disease Model")
    parser.add_argument("--config", type=str, default="ml/config.yaml", help="Path to config.yaml")
    parser.add_argument("--epochs", type=int, default=None, help="Override number of epochs")
    parser.add_argument("--dry-run", action="store_true", help="Perform model dry-run initialization check")
    args = parser.parse_args()

    train_model(config_path=args.config, epochs_override=args.epochs, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
