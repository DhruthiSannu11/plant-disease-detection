"""
Unit tests for dataset preprocessing helper functions.
"""

from pathlib import Path

from PIL import Image

from scripts.preprocess_dataset import is_valid_image


def test_is_valid_image(tmp_path: Path):
    """Test image validity checker on valid JPEG and corrupted/empty file."""
    # Create valid dummy image
    valid_img_path = tmp_path / "valid_leaf.jpg"
    img = Image.new("RGB", (100, 100), color="green")
    img.save(valid_img_path)
    assert is_valid_image(valid_img_path) is True

    # Create empty 0-byte file
    corrupt_img_path = tmp_path / "corrupt_leaf.jpg"
    corrupt_img_path.write_bytes(b"")
    assert is_valid_image(corrupt_img_path) is False
