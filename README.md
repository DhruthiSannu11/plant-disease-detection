# 🌿 Plant Health AI: Enterprise Disease Detection & Botanical Diagnostics

> **Production-grade Plant Disease Detection platform powered by PyTorch, ONNX INT8 Quantization, Explainable AI (Grad-CAM), FastAPI, and Next.js.**

[![Python 3.12](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://python.org)
[![PyTorch 2.x](https://img.shields.io/badge/PyTorch-2.x-EE4C2C?logo=pytorch&logoColor=white)](https://pytorch.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-Async-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![ONNX Runtime](https://img.shields.io/badge/ONNX_Runtime-INT8_Quantized-005C8A?logo=onnx&logoColor=white)](https://onnxruntime.ai)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?logo=next.js&logoColor=white)](https://nextjs.org)
[![Docker](https://img.shields.io/badge/Docker-Multi--Container-2496ED?logo=docker&logoColor=white)](https://docker.com)
[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/DhruthiSannu11/plant-disease-detection/blob/main/notebooks/plant_disease_colab_setup.ipynb)

---

## ☁️ Google Colab Cloud Data & Training

Execute dataset setup, image preprocessing, and GPU model training directly in Google Colab:

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/DhruthiSannu11/plant-disease-detection/blob/main/notebooks/plant_disease_colab_setup.ipynb)

---


## 🌟 Key Platform Capabilities

- 🚀 **Sub-50ms Inference**: Quantized ONNX Runtime INT8 execution running smoothly on low-cost CPU servers.
- 🎯 **Explainable AI (Grad-CAM)**: Visual heatmap overlay showing exact diseased leaf spots behind every AI diagnosis.
- 💊 **Botanical Treatment Engine**: Automated organic remedies, chemical pesticides, and prevention protocols for 38+ plant disease classes.
- 📱 **Offline-First PWA**: Mobile webcam/camera scanner with offline service worker caching for field agronomists.
- 🗺️ **Outbreak Geo-Mapping**: Real-time geospatial tracking of crop disease clusters.

---

## 🚀 Quick Start (Local Docker Development)

```bash
# Clone repository
git clone https://github.com/DhruthiSannu11/plant-disease-detection.git
cd plant-disease-detection

# Copy environment configuration
cp .env.example .env

# Start multi-container stack
docker-compose up --build
```

- **REST API Endpoints**: [http://localhost:8000/api/v1/health](http://localhost:8000/api/v1/health) (JSON REST API)
- **Interactive REST API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs) (Swagger UI)
- **Frontend Web App**: [http://localhost:3000](http://localhost:3000) (Next.js / React)
