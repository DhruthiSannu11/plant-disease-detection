"""
Grad-CAM Service Wrapper for FastAPI Backend.
Generates explainable visual heatmaps for disease predictions.
"""

from pathlib import Path
from typing import Optional

import numpy as np
import torch
from PIL import Image

from ml.models.leaf_classifier import LeafClassifier
from ml.explainability.gradcam import GradCAM


class GradCAMService:
    """
    Service wrapper managing PyTorch LeafClassifier & GradCAM heatmap generation.
    """

    _instance: Optional["GradCAMService"] = None

    def __new__(cls, checkpoint_path: str = "ml/checkpoints/best_model.pth"):
        if cls._instance is None:
            cls._instance = super(GradCAMService, cls).__new__(cls)
            cls._instance._init_service(checkpoint_path)
        return cls._instance

    def _init_service(self, checkpoint_path: str):
        self.checkpoint_path = Path(checkpoint_path)
        self.device = torch.device("cpu")

        self.model = LeafClassifier(num_classes=38, pretrained=False).to(self.device)

        if self.checkpoint_path.exists():
            checkpoint = torch.load(self.checkpoint_path, map_location=self.device)
            self.model.load_state_dict(checkpoint["model_state_dict"])

        self.model.eval()
        self.gradcam = GradCAM(self.model)

    def generate_heatmap_base64(
        self, image: Image.Image, target_class_idx: Optional[int] = None, alpha: float = 0.5
    ) -> str:
        """
        Generates Grad-CAM visual heatmap overlay for input image and returns base64 string.
        """
        img_rgb = image.convert("RGB").resize((224, 224))
        img_np = np.array(img_rgb)

        # Normalize tensor matching PyTorch ImageNet standards
        img_tensor = torch.from_numpy(img_np).permute(2, 0, 1).float() / 255.0
        mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
        std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
        img_tensor = (img_tensor - mean) / std
        img_tensor = img_tensor.unsqueeze(0)

        # Generate heatmap & overlay
        heatmap = self.gradcam.generate_heatmap(img_tensor, target_class_idx=target_class_idx)
        blended = GradCAM.overlay_heatmap(img_rgb, heatmap, alpha=alpha)

        # Encode to base64 Data URL
        return GradCAM.encode_base64(blended, format="JPEG")
