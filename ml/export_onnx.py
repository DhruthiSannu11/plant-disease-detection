"""
Export PyTorch LeafClassifier trained checkpoint (best_model.pth) to ONNX format.
Enables fast, platform-independent CPU inference without PyTorch dependencies.
"""

import argparse
import sys
from pathlib import Path
import yaml

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import torch
import onnx

# Add project root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.models.leaf_classifier import LeafClassifier


def export_to_onnx(
    checkpoint_path: str = "ml/checkpoints/best_model.pth",
    output_onnx_path: str = "ml/checkpoints/model.onnx",
    config_path: str = "ml/config.yaml",
):
    """
    Exports PyTorch model checkpoint to ONNX format.
    """
    checkpoint_p = Path(checkpoint_path)
    output_p = Path(output_onnx_path)
    config_p = Path(config_path)

    if not checkpoint_p.exists():
        raise FileNotFoundError(f"❌ Checkpoint file not found: {checkpoint_p}")

    with open(config_p, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    device = torch.device("cpu")
    num_classes = cfg["model"]["num_classes"]
    model_name = cfg["model"]["name"]
    dropout_rate = cfg["model"]["dropout_rate"]
    hidden_dim = cfg["model"]["hidden_dim"]

    print(f"📦 Loading PyTorch Checkpoint from: {checkpoint_p}")
    model = LeafClassifier(
        num_classes=num_classes,
        model_name=model_name,
        pretrained=False,
        dropout_rate=dropout_rate,
        hidden_dim=hidden_dim,
    ).to(device)

    checkpoint = torch.load(checkpoint_p, map_location=device)
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    print(f"✅ Model restored successfully! (Val F1: {checkpoint.get('val_f1', 'N/A')})")

    # Create dummy input matching standard leaf image size (1, 3, 224, 224)
    image_size = cfg["dataset"]["image_size"]
    dummy_input = torch.randn(1, 3, image_size, image_size, device=device)

    output_p.parent.mkdir(parents=True, exist_ok=True)

    print(f"⚡ Exporting model to ONNX: {output_p}")
    torch.onnx.export(
        model,
        dummy_input,
        str(output_p),
        export_params=True,
        opset_version=17,
        do_constant_folding=True,
        input_names=["input"],
        output_names=["output"],
        dynamic_axes={
            "input": {0: "batch_size"},
            "output": {0: "batch_size"},
        },
        dynamo=False,
    )

    # Validate ONNX graph integrity
    onnx_model = onnx.load(str(output_p))
    onnx.checker.check_model(onnx_model)

    size_mb = output_p.stat().st_size / (1024 * 1024)
    print(f"🎉 ONNX Export Successful! Saved at: {output_p} ({size_mb:.2f} MB)")
    return output_p


def main():
    parser = argparse.ArgumentParser(description="Export PyTorch Plant Disease Model to ONNX")
    parser.add_argument("--checkpoint", type=str, default="ml/checkpoints/best_model.pth", help="Path to PyTorch .pth checkpoint")
    parser.add_argument("--output", type=str, default="ml/checkpoints/model.onnx", help="Output path for .onnx model")
    parser.add_argument("--config", type=str, default="ml/config.yaml", help="Path to config.yaml")
    args = parser.parse_args()

    export_to_onnx(checkpoint_path=args.checkpoint, output_onnx_path=args.output, config_path=args.config)


if __name__ == "__main__":
    main()
