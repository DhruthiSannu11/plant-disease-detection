"""
Unit tests for PyTorch Grad-CAM visual heatmap engine and image overlay utilities.
"""

from pathlib import Path
import numpy as np
import pytest
import torch
from PIL import Image

from ml.models.leaf_classifier import LeafClassifier
from ml.explainability.gradcam import GradCAM


@pytest.fixture(scope="module")
def model_and_gradcam():
    """Fixture providing initialized LeafClassifier model and GradCAM engine."""
    model = LeafClassifier(num_classes=38, pretrained=False)
    model.eval()
    gradcam = GradCAM(model)
    return model, gradcam


def test_gradcam_target_layer_detection(model_and_gradcam):
    """Verify GradCAM automatically detects the final Conv2d target layer in LeafClassifier."""
    _, gradcam = model_and_gradcam

    assert gradcam.target_layer is not None
    assert isinstance(gradcam.target_layer, torch.nn.Conv2d)


def test_gradcam_heatmap_dimensions_and_range(model_and_gradcam):
    """Verify Grad-CAM generates 2D heatmap array with values normalized to [0.0, 1.0]."""
    _, gradcam = model_and_gradcam

    batch_size = 1
    dummy_input = torch.randn(batch_size, 3, 224, 224)

    heatmap = gradcam.generate_heatmap(dummy_input, target_class_idx=10)

    assert isinstance(heatmap, np.ndarray)
    assert heatmap.ndim == 2
    assert np.min(heatmap) >= 0.0
    assert np.max(heatmap) <= 1.0
    assert not np.isnan(heatmap).any()


def test_gradcam_overlay_blending_and_base64(model_and_gradcam):
    """Verify overlay_heatmap produces (224, 224, 3) RGB uint8 image and valid base64 string."""
    _, gradcam = model_and_gradcam

    # Create dummy leaf RGB image and heatmap
    original_np = np.full((224, 224, 3), 128, dtype=np.uint8)
    dummy_heatmap = np.random.rand(7, 7).astype(np.float32)

    # Test array overlay
    blended = GradCAM.overlay_heatmap(original_np, dummy_heatmap, alpha=0.5)

    assert isinstance(blended, np.ndarray)
    assert blended.shape == (224, 224, 3)
    assert blended.dtype == np.uint8

    # Test PIL Image input overlay
    pil_img = Image.fromarray(original_np)
    blended_pil = GradCAM.overlay_heatmap(pil_img, dummy_heatmap, alpha=0.6)
    assert blended_pil.shape == (224, 224, 3)

    # Test base64 encoding
    b64_str = GradCAM.encode_base64(blended)
    assert isinstance(b64_str, str)
    assert b64_str.startswith("data:image/jpeg;base64,")
