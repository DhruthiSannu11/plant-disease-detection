"""
Botanical Diagnosis Service loading and retrieving structured treatment guides.
"""

import json
from pathlib import Path
from typing import Dict, Optional, Any
from backend.app.schemas.predict import DiagnosticDetails


class DiagnosisService:
    """Singleton service mapping plant disease class labels to botanical diagnostic guides."""

    _instance: Optional["DiagnosisService"] = None

    def __new__(cls, database_path: Optional[str] = None) -> "DiagnosisService":
        if cls._instance is None:
            cls._instance = super(DiagnosisService, cls).__new__(cls)
            cls._instance._load_database(database_path)
        return cls._instance

    def _load_database(self, custom_path: Optional[str] = None) -> None:
        """Loads diseases.json knowledge base file."""
        if custom_path:
            db_path = Path(custom_path)
        else:
            db_path = Path(__file__).resolve().parent.parent / "data" / "diseases.json"

        if not db_path.exists():
            raise FileNotFoundError(f"❌ Botanical knowledge base missing: {db_path}")

        with open(db_path, "r", encoding="utf-8") as f:
            self.knowledge_base: Dict[str, Dict[str, Any]] = json.load(f)

        print(f"✅ Loaded Botanical Knowledge Base with {len(self.knowledge_base)} disease class entries.")

    def get_diagnosis(self, disease_name: str) -> Optional[DiagnosticDetails]:
        """
        Retrieves DiagnosticDetails Pydantic schema for a given disease class label.
        Returns fallback default details if class label is unrecognized.
        """
        data = self.knowledge_base.get(disease_name)
        if data:
            return DiagnosticDetails(**data)

        # Fallback for unknown class labels
        return DiagnosticDetails(
            common_name=disease_name.replace("___", " - ").replace("_", " "),
            scientific_name="Unknown species",
            crop=disease_name.split("___")[0].replace("_", " ") if "___" in disease_name else "Unknown",
            pathogen_type="Unknown",
            severity="Moderate",
            symptoms=["General foliage discoloration or lesion spots observed"],
            organic_remedies=["Isolate affected plants to prevent spread", "Apply general neem oil or copper spray"],
            chemical_treatments=["Consult local agricultural extension office for targeted advice"],
            preventive_protocols=["Practice crop rotation and maintain balanced irrigation"],
        )
