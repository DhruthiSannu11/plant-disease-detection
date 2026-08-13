"""
Unit Tests for Botanical Diagnosis Service and diseases.json Knowledge Base.
"""

import json
import pytest
from pathlib import Path
from backend.app.services.diagnosis_service import DiagnosisService
from backend.app.schemas.predict import DiagnosticDetails


@pytest.fixture
def knowledge_base_data():
    """Load diseases.json file content."""
    json_path = Path(__file__).resolve().parent.parent / "backend" / "app" / "data" / "diseases.json"
    assert json_path.exists(), f"diseases.json file missing at: {json_path}"
    with open(json_path, "r", encoding="utf-8") as f:
        return json.load(f)


def test_knowledge_base_38_classes_completeness(knowledge_base_data):
    """Verify all 38 PlantVillage disease classes are present with complete non-empty fields."""
    assert len(knowledge_base_data) == 38, f"Expected 38 class entries, found {len(knowledge_base_data)}"

    required_fields = [
        "common_name",
        "scientific_name",
        "crop",
        "pathogen_type",
        "severity",
        "symptoms",
        "organic_remedies",
        "chemical_treatments",
        "preventive_protocols",
    ]

    for class_label, data in knowledge_base_data.items():
        for field in required_fields:
            assert field in data, f"Class '{class_label}' missing required field '{field}'"

            val = data[field]
            if isinstance(val, list):
                assert len(val) > 0, f"Class '{class_label}' has empty list for '{field}'"
                for item in val:
                    assert isinstance(item, str) and len(item.strip()) > 0
            else:
                assert isinstance(val, str) and len(val.strip()) > 0


def test_diagnosis_service_retrieval():
    """Verify DiagnosisService retrieves valid DiagnosticDetails instances."""
    service = DiagnosisService()

    # Test valid class retrieval
    details = service.get_diagnosis("Tomato___Early_blight")
    assert isinstance(details, DiagnosticDetails)
    assert details.common_name == "Tomato Early Blight"
    assert details.scientific_name == "Alternaria solani"
    assert details.pathogen_type == "Fungal"
    assert len(details.organic_remedies) > 0
    assert len(details.chemical_treatments) > 0
    assert len(details.preventive_protocols) > 0


def test_diagnosis_service_fallback():
    """Verify DiagnosisService returns non-null fallback details for unknown class label."""
    service = DiagnosisService()
    details = service.get_diagnosis("Unknown___Exotic_Rot")

    assert isinstance(details, DiagnosticDetails)
    assert "Unknown" in details.common_name or "Exotic" in details.common_name
    assert details.scientific_name == "Unknown species"
    assert len(details.symptoms) > 0
    assert len(details.organic_remedies) > 0
