# 🌿 Plant Disease Detection System (2026 Edition)

An end-to-end, enterprise-grade AI system for agricultural leaf disease classification, explainable AI (Grad-CAM heatmaps), botanical treatment recommendations, and real-time farmer diagnostic reporting.

## 🌟 Key Features
- **Deep Learning Engine**: PyTorch 2.x transfer learning (EfficientNet-V2 / MobileNetV4) trained on 38 plant disease classes.
- **Ultra-Fast CPU Inference**: Quantized ONNX Runtime INT8 model execution (<50ms per scan).
- **Explainable AI (XAI)**: Grad-CAM visual heatmaps overlaying diseased leaf regions so farmers understand the diagnosis.
- **Botanical Knowledge Base**: Automated organic remedies, chemical pesticides, and prevention protocols for each disease.
- **Modern Full-Stack UI**: Responsive Next.js / React app with drag-and-drop file upload, live webcam scanner, PWA offline support, and multi-language localization.
- **Outbreak Geo-Mapping**: GeoJSON heatmap tracking crop disease outbreaks by location.

## 🚀 Quick Start (Local Docker Development)
```bash
# Clone repository
git clone https://github.com/your-username/plant-disease-detection.git
cd plant-disease-detection

# Copy environment variables
cp .env.example .env

# Start multi-container stack
docker-compose up --build
```

- **Backend API**: `http://localhost:8000/docs` (FastAPI Swagger)
- **Frontend App**: `http://localhost:3000` (Next.js / React)

## 📖 Developer Documentation & Master Roadmap
For complete project roadmap, execution protocol, financial breakdown, and ticket specifications, see [`roadmap.md`](./roadmap.md).
