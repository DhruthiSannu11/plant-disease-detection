"""
ONNX Runtime Inference Service for Plant Disease Diagnostics.
Provides ultra-fast (<50ms) CPU image classification with ImageNet normalization.
"""

import sys
import time
from pathlib import Path
from typing import List, Tuple, Dict, Optional

import numpy as np
from PIL import Image

import torch
import onnxruntime as ort

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Default PlantVillage 38-Class Botanical Names Mapping
PLANTVILLAGE_CLASSES = [
    "Apple___Apple_scab",
    "Apple___Black_rot",
    "Apple___Cedar_apple_rust",
    "Apple___healthy",
    "Blueberry___healthy",
    "Cherry_(including_sour)___Powdery_mildew",
    "Cherry_(including_sour)___healthy",
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot",
    "Corn_(maize)___Common_rust_",
    "Corn_(maize)___Northern_Leaf_Blight",
    "Corn_(maize)___healthy",
    "Grape___Black_rot",
    "Grape___Esca_(Black_Measles)",
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)",
    "Grape___healthy",
    "Orange___Haunglongbing_(Citrus_greening)",
    "Peach___Bacterial_spot",
    "Peach___healthy",
    "Pepper,_bell___Bacterial_spot",
    "Pepper,_bell___healthy",
    "Potato___Early_blight",
    "Potato___Late_blight",
    "Potato___healthy",
    "Raspberry___healthy",
    "Soybean___healthy",
    "Squash___Powdery_mildew",
    "Strawberry___Leaf_scorch",
    "Strawberry___healthy",
    "Tomato___Bacterial_spot",
    "Tomato___Early_blight",
    "Tomato___Late_blight",
    "Tomato___Leaf_Mold",
    "Tomato___Septoria_leaf_spot",
    "Tomato___Spider_mites Two-spotted_spider_mite",
    "Tomato___Target_Spot",
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
    "Tomato___Tomato_mosaic_virus",
    "Tomato___healthy",
]


class ONNXInferenceService:
    """
    Singleton ONNX Runtime Inference Service managing session setup and preprocessing.
    """

    _instance: Optional["ONNXInferenceService"] = None

    def __new__(cls, model_path: str = "ml/checkpoints/model_quantized.onnx"):
        if cls._instance is None:
            cls._instance = super(ONNXInferenceService, cls).__new__(cls)
            cls._instance._init_service(model_path)
        return cls._instance

    def _init_service(self, model_path: str):
        self.model_path = Path(model_path)
        if not self.model_path.exists():
            # Fallback to model.onnx if model_quantized.onnx is absent
            fallback = Path("ml/checkpoints/model.onnx")
            if fallback.exists():
                self.model_path = fallback
            else:
                raise FileNotFoundError(f"❌ ONNX model file not found at: {self.model_path}")

        print(f"⚡ Initializing ONNX Runtime Session: {self.model_path}")
        self.session = ort.InferenceSession(str(self.model_path), providers=["CPUExecutionProvider"])
        self.input_name = self.session.get_inputs()[0].name

        # Load idx_to_class mapping from PyTorch checkpoint if available
        self.idx_to_class = self._load_class_mapping()

    def _load_class_mapping(self) -> Dict[int, str]:
        pth_path = Path("ml/checkpoints/best_model.pth")
        if pth_path.exists():
            try:
                checkpoint = torch.load(pth_path, map_location="cpu")
                if "idx_to_class" in checkpoint:
                    raw_mapping = checkpoint["idx_to_class"]
                    return {int(k): str(v) for k, v in raw_mapping.items()}
            except Exception:
                pass

        return {i: cls_name for i, cls_name in enumerate(PLANTVILLAGE_CLASSES)}

    @staticmethod
    def preprocess_image(image: Image.Image, image_size: int = 224) -> np.ndarray:
        """Preprocesses PIL Image to normalized float32 tensor array (1, 3, 224, 224)."""
        img = image.convert("RGB").resize((image_size, image_size))
        img_np = np.array(img, dtype=np.float32) / 255.0

        # ImageNet channel normalization
        mean = np.array([0.485, 0.456, 0.406], dtype=np.float32)
        std = np.array([0.229, 0.224, 0.225], dtype=np.float32)
        img_np = (img_np - mean) / std

        # Transpose from (H, W, C) to (C, H, W) and expand batch dim (1, C, H, W)
        tensor = np.transpose(img_np, (2, 0, 1))
        return np.expand_dims(tensor, axis=0).astype(np.float32)

    def predict(self, image: Image.Image, top_k: int = 3) -> Tuple[List[Dict], float]:
        """
        Runs ONNX Runtime inference on input image.
        Returns (top_k_predictions, inference_time_ms).
        """
        input_tensor = self.preprocess_image(image)

        start_time = time.time()
        outputs = self.session.run(None, {self.input_name: input_tensor})
        inference_time_ms = (time.time() - start_time) * 1000.0

        logits = outputs[0][0]  # Shape (38,)

        # Compute Softmax probabilities
        exp_logits = np.exp(logits - np.max(logits))
        probs = exp_logits / np.sum(exp_logits)

        # Get top-K indices
        top_k_indices = np.argsort(probs)[::-1][:top_k]

        predictions = []
        for idx in top_k_indices:
            class_id = int(idx)
            disease_name = self.idx_to_class.get(class_id, f"Class_{class_id}")
            confidence = float(probs[class_id])
            predictions.append(
                {
                    "class_id": class_id,
                    "disease_name": disease_name,
                    "confidence": confidence,
                }
            )

        return predictions, inference_time_ms
