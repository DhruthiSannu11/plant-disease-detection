"""
Generate Sample Grad-CAM Heatmap Visualization.
Runs Grad-CAM engine on a sample leaf image and saves the output heatmap image.
"""

import sys
from pathlib import Path

import numpy as np
import torch
from PIL import Image

# Add project root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.models.leaf_classifier import LeafClassifier
from ml.explainability.gradcam import GradCAM


def run_sample_visualization(
    checkpoint_path: str = "ml/checkpoints/best_model.pth",
    output_image_path: str = "ml/explainability/sample_gradcam_output.jpg",
):
    checkpoint_p = Path(checkpoint_path)
    output_p = Path(output_image_path)

    print("🌿 Initializing PyTorch LeafClassifier...")
    model = LeafClassifier(num_classes=38, pretrained=False)

    if checkpoint_p.exists():
        print(f"📦 Loading trained checkpoint from: {checkpoint_p}")
        checkpoint = torch.load(checkpoint_p, map_location="cpu")
        model.load_state_dict(checkpoint["model_state_dict"])
    else:
        print("💡 Running with initialized weights (for demonstration)...")

    model.eval()

    print("🔍 Initializing Grad-CAM engine...")
    gradcam = GradCAM(model)

    # Generate synthetic sample leaf image (224, 224, 3)
    np.random.seed(42)
    sample_rgb = np.zeros((224, 224, 3), dtype=np.uint8)
    sample_rgb[:, :] = [34, 139, 34]  # Forest Green leaf background
    # Add simulated lesion spot in center
    sample_rgb[80:140, 80:140] = [139, 69, 19]  # Brown spot

    # Convert to PyTorch input tensor (1, 3, 224, 224)
    img_tensor = torch.from_numpy(sample_rgb).permute(2, 0, 1).float().unsqueeze(0) / 255.0

    print("🔥 Computing Grad-CAM activation heatmap...")
    heatmap = gradcam.generate_heatmap(img_tensor)

    print("🎨 Overlaying heatmap onto leaf image...")
    blended = GradCAM.overlay_heatmap(sample_rgb, heatmap, alpha=0.5)

    output_p.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(blended).save(output_p)

    print(f"✅ Sample Grad-CAM Heatmap saved successfully to: {output_p}")
    return output_p


if __name__ == "__main__":
    run_sample_visualization()
