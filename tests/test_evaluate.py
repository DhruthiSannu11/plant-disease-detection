"""
Automated Unit & Integration Tests for ML Evaluation Pipeline & MLflow Model Registry (PD-7).
"""

import json
import os
import shutil
import tempfile
from pathlib import Path
import numpy as np
import pytest

from ml.evaluate import (
    compute_evaluation_metrics,
    generate_confusion_matrix_plot,
    benchmark_inference_latency,
    evaluate_synthetic_data,
    run_evaluation,
)
from ml.models.leaf_classifier import LeafClassifier


def test_compute_evaluation_metrics():
    """Verify multi-class evaluation metric calculations."""
    num_classes = 5
    y_true = np.array([0, 1, 2, 3, 4, 0, 1, 2, 3, 4])
    y_pred = np.array([0, 1, 2, 3, 4, 0, 1, 2, 3, 0])  # 9/10 correct
    
    # Simulate probabilities
    y_prob = np.zeros((10, num_classes))
    for i, p in enumerate(y_pred):
        y_prob[i, p] = 0.9
        y_prob[i] += 0.02

    class_names = [f"Class_{i}" for i in range(num_classes)]
    metrics = compute_evaluation_metrics(
        y_true=y_true,
        y_pred=y_pred,
        y_prob=y_prob,
        num_classes=num_classes,
        class_names=class_names,
    )

    assert metrics["accuracy"] == 0.9
    assert metrics["top5_accuracy"] == 1.0
    assert 0.0 <= metrics["macro_f1"] <= 1.0
    assert 0.0 <= metrics["weighted_f1"] <= 1.0
    assert metrics["total_samples"] == 10
    assert metrics["num_classes"] == num_classes
    assert len(metrics["per_class"]) == num_classes
    assert len(metrics["confusion_matrix"]) == num_classes


def test_generate_confusion_matrix_plot(tmp_path):
    """Verify generation and saving of high-resolution Confusion Matrix heatmap plot."""
    num_classes = 38
    cm = np.eye(num_classes, dtype=int) * 10
    output_png = tmp_path / "test_cm.png"

    plot_path = generate_confusion_matrix_plot(
        cm=cm,
        output_path=output_png,
        class_names=[f"Disease_{i:02d}" for i in range(num_classes)],
    )

    assert plot_path.exists()
    assert plot_path.stat().st_size > 5000  # Non-trivial image file size


def test_benchmark_inference_latency():
    """Verify CPU inference latency benchmark returns structured statistics."""
    model = LeafClassifier(num_classes=38, model_name="resnet18", pretrained=False)
    model.eval()

    latency_stats = benchmark_inference_latency(
        model_or_session=model,
        is_onnx=False,
        input_shape=(1, 3, 224, 224),
        num_runs=5,
        warmup_runs=2,
        device="cpu",
    )

    assert "mean_latency_ms" in latency_stats
    assert "p95_latency_ms" in latency_stats
    assert "throughput_fps" in latency_stats
    assert latency_stats["mean_latency_ms"] > 0
    assert latency_stats["throughput_fps"] > 0


def test_evaluate_synthetic_data():
    """Verify synthetic validation data generator output formats."""
    y_true, y_pred, y_prob = evaluate_synthetic_data(num_samples=50, num_classes=38)

    assert len(y_true) == 50
    assert len(y_pred) == 50
    assert y_prob.shape == (50, 38)
    assert np.all(y_true >= 0) and np.all(y_true < 38)
    assert np.all(y_pred >= 0) and np.all(y_pred < 38)


def test_run_evaluation_dry_run_pipeline(tmp_path):
    """Verify complete evaluation pipeline with MLflow tracking in dry-run mode."""
    reports_dir = tmp_path / "reports"
    mlruns_dir = tmp_path / "mlruns"
    tracking_uri = f"file:///{mlruns_dir}".replace("\\", "/")

    metrics = run_evaluation(
        config_path="ml/config.yaml",
        checkpoint_path=None,
        output_dir=str(reports_dir),
        experiment_name="test-plant-disease-evaluation",
        run_name="test_run",
        dry_run=True,
        register_model=False,
        use_mlflow=True,
        tracking_uri=tracking_uri,
    )

    assert metrics is not None
    assert "accuracy" in metrics
    assert metrics["accuracy"] > 0.8
    assert "macro_f1" in metrics
    assert "latency" in metrics

    # Verify generated report files
    assert (reports_dir / "confusion_matrix.png").exists()
    assert (reports_dir / "classification_report.json").exists()
    assert (reports_dir / "eval_summary.json").exists()

    with open(reports_dir / "eval_summary.json", "r", encoding="utf-8") as f:
        summary = json.load(f)
        assert "accuracy" in summary
        assert "macro_f1" in summary
