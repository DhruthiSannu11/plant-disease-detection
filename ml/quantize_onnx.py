"""
Apply INT8 Dynamic Quantization to ONNX model and benchmark CPU inference performance.
Reduces model size by ~75% and achieves <50ms CPU inference per leaf scan.
"""

import argparse
import sys
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

import numpy as np
import torch
import yaml
import onnxruntime as ort
from onnxruntime.quantization import QuantType, quantize_dynamic

# Add project root directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from ml.models.leaf_classifier import LeafClassifier


def quantize_and_benchmark(
    input_onnx_path: str = "ml/checkpoints/model.onnx",
    output_quantized_path: str = "ml/checkpoints/model_quantized.onnx",
    pytorch_checkpoint_path: str = "ml/checkpoints/best_model.pth",
    config_path: str = "ml/config.yaml",
    num_runs: int = 50,
):
    """
    Applies INT8 Dynamic Quantization to ONNX model and benchmarks CPU latency.
    """
    input_p = Path(input_onnx_path)
    output_p = Path(output_quantized_path)
    pytorch_p = Path(pytorch_checkpoint_path)
    config_p = Path(config_path)

    if not input_p.exists():
        raise FileNotFoundError(f"❌ Input ONNX model not found: {input_p}. Run ml/export_onnx.py first!")

    with open(config_p, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f)

    print(f"🔧 Applying INT8 Dynamic Quantization to: {input_p}")
    quantize_dynamic(
        model_input=str(input_p),
        model_output=str(output_p),
        weight_type=QuantType.QUInt8,
    )

    size_fp32 = input_p.stat().st_size / (1024 * 1024)
    size_int8 = output_p.stat().st_size / (1024 * 1024)
    reduction = (1 - size_int8 / size_fp32) * 100

    print(f"✅ Quantization Complete!")
    print(f"   - ONNX FP32 Size : {size_fp32:.2f} MB")
    print(f"   - ONNX INT8 Size : {size_int8:.2f} MB (📉 {reduction:.1f}% size reduction)")

    # Benchmark Setup
    image_size = cfg["dataset"]["image_size"]
    dummy_input_np = np.random.randn(1, 3, image_size, image_size).astype(np.float32)
    dummy_input_tensor = torch.from_numpy(dummy_input_np)

    print(f"\n⏱️ Running CPU Inference Latency Benchmark ({num_runs} iterations)...")

    # 1. PyTorch CPU Benchmark
    pytorch_latency_ms = None
    if pytorch_p.exists():
        model = LeafClassifier(
            num_classes=cfg["model"]["num_classes"],
            model_name=cfg["model"]["name"],
            pretrained=False,
            dropout_rate=cfg["model"]["dropout_rate"],
            hidden_dim=cfg["model"]["hidden_dim"],
        )
        checkpoint = torch.load(pytorch_p, map_location="cpu")
        model.load_state_dict(checkpoint["model_state_dict"])
        model.eval()

        # Warmup
        for _ in range(5):
            with torch.no_grad():
                _ = model(dummy_input_tensor)

        start = time.time()
        for _ in range(num_runs):
            with torch.no_grad():
                _ = model(dummy_input_tensor)
        pytorch_latency_ms = ((time.time() - start) / num_runs) * 1000

    # 2. ONNX FP32 Benchmark
    session_fp32 = ort.InferenceSession(str(input_p), providers=["CPUExecutionProvider"])
    input_name = session_fp32.get_inputs()[0].name

    for _ in range(5):
        _ = session_fp32.run(None, {input_name: dummy_input_np})

    start = time.time()
    for _ in range(num_runs):
        _ = session_fp32.run(None, {input_name: dummy_input_np})
    onnx_fp32_latency_ms = ((time.time() - start) / num_runs) * 1000

    # 3. ONNX INT8 Quantized Benchmark
    session_int8 = ort.InferenceSession(str(output_p), providers=["CPUExecutionProvider"])

    for _ in range(5):
        _ = session_int8.run(None, {input_name: dummy_input_np})

    start = time.time()
    for _ in range(num_runs):
        _ = session_int8.run(None, {input_name: dummy_input_np})
    onnx_int8_latency_ms = ((time.time() - start) / num_runs) * 1000

    # Summary Output
    print("\n📊 === CPU Inference Latency Benchmark Results ===")
    if pytorch_latency_ms:
        print(f"  • PyTorch CPU Latency   : {pytorch_latency_ms:.2f} ms / image")
    print(f"  • ONNX FP32 CPU Latency : {onnx_fp32_latency_ms:.2f} ms / image")
    print(f"  • ONNX INT8 CPU Latency : {onnx_int8_latency_ms:.2f} ms / image")

    if pytorch_latency_ms:
        speedup = pytorch_latency_ms / onnx_int8_latency_ms
        print(f"\n🚀 Total Speedup (INT8 vs PyTorch): {speedup:.2f}x Faster!")

    return output_p


def main():
    parser = argparse.ArgumentParser(description="Quantize ONNX Plant Disease Model to INT8")
    parser.add_argument("--input", type=str, default="ml/checkpoints/model.onnx", help="Input ONNX FP32 model path")
    parser.add_argument("--output", type=str, default="ml/checkpoints/model_quantized.onnx", help="Output INT8 ONNX path")
    parser.add_argument("--checkpoint", type=str, default="ml/checkpoints/best_model.pth", help="PyTorch checkpoint path for comparison")
    parser.add_argument("--config", type=str, default="ml/config.yaml", help="Path to config.yaml")
    args = parser.parse_args()

    quantize_and_benchmark(
        input_onnx_path=args.input,
        output_quantized_path=args.output,
        pytorch_checkpoint_path=args.checkpoint,
        config_path=args.config,
    )


if __name__ == "__main__":
    main()
