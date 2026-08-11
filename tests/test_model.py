"""
Unit tests for PyTorch LeafClassifier model architecture.
"""

import torch
from ml.models.leaf_classifier import LeafClassifier

def test_model_forward_pass_shape():
    """Verify PyTorch model forward pass accepts (batch, 3, 224, 224) and outputs (batch, 38)."""
    batch_size = 4
    num_classes = 38
    dummy_input = torch.randn(batch_size, 3, 224, 224)

    model = LeafClassifier(num_classes=num_classes, pretrained=False)
    model.eval()

    with torch.no_grad():
        outputs = model(dummy_input)

    assert outputs.shape == (batch_size, num_classes)
    assert not torch.isnan(outputs).any()
