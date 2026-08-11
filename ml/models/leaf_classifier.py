"""
PyTorch Transfer Learning Architecture for 38-Class Plant Disease Diagnostics.
Supports EfficientNet-V2 and MobileNet-V4/V3 backbone feature extractors.
"""

import torch
import torch.nn as nn
import torchvision.models as models


class LeafClassifier(nn.Module):
    def __init__(
        self,
        num_classes: int = 38,
        model_name: str = "efficientnet_v2_s",
        pretrained: bool = True,
        dropout_rate: float = 0.3,
        hidden_dim: int = 512,
    ):
        super(LeafClassifier, self).__init__()
        self.model_name = model_name
        self.num_classes = num_classes

        weights = "DEFAULT" if pretrained else None

        if "efficientnet" in model_name.lower():
            self.backbone = models.efficientnet_v2_s(weights=weights)
            in_features = self.backbone.classifier[1].in_features
            self.backbone.classifier = nn.Identity()
        elif "mobilenet" in model_name.lower():
            self.backbone = models.mobilenet_v3_large(weights=weights)
            in_features = self.backbone.classifier[0].in_features
            self.backbone.classifier = nn.Identity()
        else:
            # Fallback ResNet18 backbone
            self.backbone = models.resnet18(weights=weights)
            in_features = self.backbone.fc.in_features
            self.backbone.fc = nn.Identity()

        # Custom Disease Diagnostics Classifier Head
        self.classifier = nn.Sequential(
            nn.Linear(in_features, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.SiLU(),
            nn.Dropout(dropout_rate),
            nn.Linear(hidden_dim, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        features = self.backbone(x)
        logits = self.classifier(features)
        return logits
