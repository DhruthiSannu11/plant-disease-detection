"""
Unit tests for ONNX Export, INT8 Quantization, and PyTorch Numerical Parity.
"""

from pathlib import Path
import numpy as np
import pytest
import torch
import yaml
import onnxruntime as ort

from ml.export_onnx import export_to_onnx
from ml.quantize_onnx import quantize_and_benchmark
from ml.models.leaf_classifier import LeafClassifier


@pytest.fixture(scope="module")
def exported_onnx_paths(tmp_path_factory):
    """Fixture exporting PyTorch model to ONNX FP32 & INT8 Quantized ONNX in temp dir."""
    tmp_dir = tmp_path_factory.mktemp("onnx_test")
    checkpoint_path = Path("ml/checkpoints/best_model.pth")
    config_path = Path("ml/config.yaml")

    if not checkpoint_path.exists():
        pytest.skip("ml/checkpoints/best_model.pth not found, skipping ONNX export test.")

    onnx_fp32_path = tmp_dir / "model.onnx"
    onnx_int8_path = tmp_dir / "model_quantized.onnx"

    export_to_onnx(
        checkpoint_path=str(checkpoint_path),
        output_onnx_path=str(onnx_fp32_path),
        config_path=str(config_path),
    )

    quantize_and_benchmark(
        input_onnx_path=str(onnx_fp32_path),
        output_quantized_path=str(onnx_int8_path),
        pytorch_checkpoint_path=str(checkpoint_path),
        config_path=str(config_path),
        num_runs=5,
    )

    return onnx_fp32_path, onnx_int8_path, checkpoint_path, config_path


def test_onnx_model_export_and_session(exported_onnx_paths):
    """Verify both FP32 and INT8 ONNX models load cleanly in ONNX Runtime sessions."""
    fp32_path, int8_path, _, _ = exported_onnx_paths

    assert fp32_path.exists()
    assert int8_path.exists()

    session_fp32 = ort.InferenceSession(str(fp32_path), providers=["CPUExecutionProvider"])
    session_int8 = ort.InferenceSession(str(int8_path), providers=["CPUExecutionProvider"])

    assert len(session_fp32.get_inputs()) == 1
    assert len(session_int8.get_inputs()) == 1
    assert session_fp32.get_inputs()[0].name == "input"
    assert session_fp32.get_outputs()[0].name == "output"


def test_onnx_inference_output_shape(exported_onnx_paths):
    """Verify ONNX model inference accepts dynamic batch size (e.g. batch_size=4) and outputs (4, 38)."""
    fp32_path, int8_path, _, _ = exported_onnx_paths

    batch_size = 4
    dummy_input = np.random.randn(batch_size, 3, 224, 224).astype(np.float32)

    session_int8 = ort.InferenceSession(str(int8_path), providers=["CPUExecutionProvider"])
    input_name = session_int8.get_inputs()[0].name

    outputs = session_int8.run(None, {input_name: dummy_input})
    logits = outputs[0]

    assert logits.shape == (batch_size, 38)
    assert not np.isnan(logits).any()


def test_pytorch_vs_onnx_numerical_parity(exported_onnx_paths):
    """Verify predictions between PyTorch model and ONNX INT8 model match with high similarity."""
    fp32_path, int8_path, checkpoint_path, config_path = exported_onnx_paths

    with open(config_path, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    # Load PyTorch model
    pytorch_model = LeafClassifier(
        num_classes=cfg["model"]["num_classes"],
        model_name=cfg["model"]["name"],
        pretrained=False,
        dropout_rate=cfg["model"]["dropout_rate"],
        hidden_dim=cfg["model"]["hidden_dim"],
    )
    checkpoint = torch.load(checkpoint_path, map_location="cpu")
    pytorch_model.load_state_dict(checkpoint["model_state_dict"])
    pytorch_model.eval()

    # Generate sample input
    np.random.seed(42)
    dummy_input_np = np.random.randn(2, 3, 224, 224).astype(np.float32)
    dummy_input_tensor = torch.from_numpy(dummy_input_np)

    # PyTorch prediction
    with torch.no_grad():
        pytorch_logits = pytorch_model(dummy_input_tensor).numpy()

    # ONNX INT8 prediction
    session_int8 = ort.InferenceSession(str(int8_path), providers=["CPUExecutionProvider"])
    input_name = session_int8.get_inputs()[0].name
    onnx_logits = session_int8.run(None, {input_name: dummy_input_np})[0]

    # Verify predicted class indices match
    pytorch_preds = np.argmax(pytorch_logits, axis=1)
    onnx_preds = np.argmax(onnx_logits, axis=1)

    assert (pytorch_preds == onnx_preds).all(), f"Class prediction mismatch: PyTorch {pytorch_preds} vs ONNX {onnx_preds}"

    # Calculate Cosine Similarity between logits vectors
    dot_product = np.sum(pytorch_logits * onnx_logits, axis=1)
    norm_pytorch = np.linalg.norm(pytorch_logits, axis=1)
    norm_onnx = np.linalg.norm(onnx_logits, axis=1)
    cosine_sim = dot_product / (norm_pytorch * norm_onnx)

    assert (cosine_sim > 0.98).all(), f"Cosine similarity too low: {cosine_sim}"
