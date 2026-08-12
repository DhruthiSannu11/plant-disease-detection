"""
PyTorch Grad-CAM (Gradient-weighted Class Activation Mapping) Visual Diagnostics Engine.
Generates explainable AI (XAI) heatmaps highlighting diseased leaf regions.
"""

import base64
import io
import sys
from typing import Union, Tuple, Optional

import cv2
import numpy as np

import torch
import torch.nn as nn
from PIL import Image

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass


class GradCAM:
    """
    Grad-CAM engine for PyTorch Convolutional Neural Networks.
    Extracts feature activation maps from target conv layers and blends visual heatmaps.
    """

    def __init__(self, model: nn.Module, target_layer: Optional[nn.Module] = None):
        self.model = model
        self.model.eval()

        self.target_layer = target_layer if target_layer is not None else self._find_target_layer()
        if self.target_layer is None:
            raise ValueError("❌ Could not auto-detect final Conv2d target layer for Grad-CAM!")

        self.activations: Optional[torch.Tensor] = None
        self.gradients: Optional[torch.Tensor] = None

        self._register_hooks()

    def _find_target_layer(self) -> Optional[nn.Module]:
        """Auto-detect final Conv2d layer in LeafClassifier architecture."""
        # 1. EfficientNet / MobileNet backbone
        if hasattr(self.model, "backbone") and hasattr(self.model.backbone, "features"):
            for layer in reversed(self.model.backbone.features):
                if isinstance(layer, nn.Conv2d):
                    return layer
                elif hasattr(layer, "iter") or isinstance(layer, (nn.Sequential, torch.nn.modules.container.ModuleList)):
                    for sublayer in reversed(list(layer.modules())):
                        if isinstance(sublayer, nn.Conv2d):
                            return sublayer

        # 2. General fallback search across all named modules
        last_conv = None
        for name, module in self.model.named_modules():
            if isinstance(module, nn.Conv2d):
                last_conv = module
        return last_conv

    def _register_hooks(self):
        """Register forward and backward hooks on target conv layer."""

        def forward_hook(module, input, output):
            self.activations = output.detach()

        def backward_hook(module, grad_input, grad_output):
            self.gradients = grad_output[0].detach()

        self.target_layer.register_forward_hook(forward_hook)
        self.target_layer.register_full_backward_hook(backward_hook)

    def generate_heatmap(
        self, input_tensor: torch.Tensor, target_class_idx: Optional[int] = None
    ) -> np.ndarray:
        """
        Generates normalized 2D Grad-CAM heatmap array [0.0, 1.0] for target class.
        """
        if input_tensor.ndim == 3:
            input_tensor = input_tensor.unsqueeze(0)

        device = next(self.model.parameters()).device
        input_tensor = input_tensor.to(device)
        input_tensor.requires_grad = True

        self.model.zero_grad()
        logits = self.model(input_tensor)

        if target_class_idx is None:
            target_class_idx = torch.argmax(logits, dim=1).item()

        target_score = logits[0, target_class_idx]
        target_score.backward()

        if self.gradients is None or self.activations is None:
            raise RuntimeError("❌ Grad-CAM failed to capture gradients/activations from target layer.")

        # Global average pooling over spatial dimensions (H, W)
        weights = torch.mean(self.gradients, dim=(2, 3), keepdim=True)
        cam = torch.sum(weights * self.activations, dim=1, keepdim=True)

        # Apply ReLU to retain positive influence
        cam = torch.relu(cam)

        # Convert to numpy array
        heatmap = cam.squeeze().cpu().numpy()

        # Normalize to [0.0, 1.0]
        min_val, max_val = np.min(heatmap), np.max(heatmap)
        if max_val - min_val > 1e-8:
            heatmap = (heatmap - min_val) / (max_val - min_val)
        else:
            heatmap = np.zeros_like(heatmap, dtype=np.float32)

        return heatmap

    @staticmethod
    def overlay_heatmap(
        original_image: Union[np.ndarray, Image.Image],
        heatmap: np.ndarray,
        alpha: float = 0.5,
        colormap: int = cv2.COLORMAP_JET,
    ) -> np.ndarray:
        """
        Overlays 2D Grad-CAM heatmap onto RGB leaf image, returning 3-channel RGB uint8 array.
        """
        if isinstance(original_image, Image.Image):
            img_np = np.array(original_image.convert("RGB"))
        else:
            img_np = original_image.copy()

        h, w = img_np.shape[:2]

        # Resize heatmap to match image dimensions
        resized_heatmap = cv2.resize(heatmap, (w, h))

        # Convert to uint8 format [0, 255]
        heatmap_uint8 = np.uint8(255 * resized_heatmap)

        # Apply OpenCV colormap (returns BGR)
        heatmap_colored_bgr = cv2.applyColorMap(heatmap_uint8, colormap)

        # Convert BGR colormap to RGB
        heatmap_colored_rgb = cv2.cvtColor(heatmap_colored_bgr, cv2.COLOR_BGR2RGB)

        # Blend original RGB image with colored heatmap
        blended = np.float32(img_np) * alpha + np.float32(heatmap_colored_rgb) * (1.0 - alpha)
        blended = np.clip(blended, 0, 255).astype(np.uint8)

        return blended

    @staticmethod
    def encode_base64(image_np: np.ndarray, format: str = "JPEG") -> str:
        """
        Encodes 3-channel RGB numpy array to base64 Data URL string.
        """
        pil_img = Image.fromarray(image_np)
        buffer = io.BytesIO()
        pil_img.save(buffer, format=format)
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return f"data:image/{format.lower()};base64,{b64_str}"
