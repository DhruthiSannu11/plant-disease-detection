# 🌿 Plant Disease Detection System (2026 Edition): Master Developer Doc & SDLC Roadmap

> **Authoritative Project Specification & Execution Protocol**  
> **Domain**: Computer Vision, Deep Learning (PyTorch/ONNX), Botanical Diagnostics & Full-Stack Web Development  
> **Tech Stack**: Python 3.12, PyTorch 2.x, ONNX Runtime, FastAPI, PostgreSQL 16, Redis, Celery, Next.js / React, TailwindCSS, Docker, AWS / Cloudflare R2, GitHub Actions  
> **Target Audience**: Agriculture tech developers, AI research engineers, farmers, agronomists  

---

## 🤖 AI Agent Execution Protocol & Self-Tracking Ruleset

When feeding any task from this roadmap to an AI Agent (e.g. Antigravity IDE, Claude, GPT, Cursor, or MCP Agent), the agent **MUST** follow these strict guidelines:

1. **Automatic Context Initialization**:
   - On every fresh session or restart, the AI agent MUST read this file (`roadmap.md`) to determine the current project status without requesting user re-explanation.
   - Look for the first ticket in the **Master Ticket Matrix** marked as `[ ] Pending`.
2. **Sequential Execution**:
   - Complete tickets strictly in order of their **Dependencies**. Do not skip tickets unless explicitly directed by the user.
3. **Definition of Done (DoD)**:
   - A ticket is considered complete ONLY when:
     1. All requested code, scripts, or configuration files are created/modified cleanly.
     2. Automated unit/integration tests pass (`pytest` / `npm test`).
     3. The status checkbox in this document is updated from `[ ] Pending` to `[x] Completed`.
     4. A brief execution summary is appended to the execution log in `LOGS.md` or PR description.
4. **Bi-Directional Issue & Ticket Linking Protocol**:
   - **GitHub Pull Request Header**: Every PR description MUST link to the corresponding issue: `🔗 **Ticket**: [PD-X](#pd-x)`.
   - **Commit Messages**: Commits must follow semantic conventions: `feat(PD-X): brief summary` or `fix(PD-X): description`.
5. **Roadmap & Internal Privacy Policy**:
   - Do NOT push sensitive environment credentials (`.env`), private API keys, or raw model dataset path secrets.
   - Treat `roadmap.md` as an **Internal Developer Document**. Keep `.gitignore` updated to exclude temporary development logs and secret files.

---

## 💰 Financial Cost Matrix & Operating Expenses (USD $ / INR ₹)

| Phase / Tier | Expense Category | Service / Provider | Monthly Cost (Est.) | Annual / One-time | Notes & Recommendations |
|---|---|---|---|---|---|
| **Phase 1 – 5 (Development)** | Local Workstation | PyTorch + Docker + FastAPI | **$0 (₹0)** | $0 | 100% Free locally. Uses CPU/GPU ONNX quantization & Docker containers. |
| **Phase 1 – 2 (Dataset & Model)** | Data Storage & ML | Kaggle / Roboflow / DVC | **$0 (₹0)** | $0 | Free public datasets (PlantVillage 38-class + field data). Free Hugging Face Model Hub hosting. |
| **Phase 6 (Staging / Testing)** | Cloud Compute | Render / Hugging Face Spaces | **$0 – $7/mo (₹0 - ₹600)** | $0 | Free tier or low-cost worker instance for FastAPI API + ONNX model serving. |
| **Phase 6 (Production MVP)** | Domain Name | Namecheap / Hostinger | — | **~$8 – $12/yr (₹700 - ₹1000)** | Custom domain (e.g., `planthealth.ai` or `.com`) with free SSL. |
| **Phase 6 (Production MVP)** | Server Compute | AWS EC2 (t4g.medium / g4dn) or Hetzner | **~$15 – $35/mo (₹1,200 - ₹2,900)** | $0 | ARM-based EC2 or GPU node for high-throughput batch inference. |
| **Phase 6 (Production MVP)** | Image & Heatmap Storage | AWS S3 / Cloudflare R2 | **~$1 – $5/mo (₹80 - ₹400)** | $0 | Cloudflare R2 provides 10GB free storage with **$0 egress fees**. |
| **Phase 6 (Production MVP)** | Database & Cache | Supabase / Neon / Render Postgres | **$0 – $10/mo (₹0 - ₹800)** | $0 | Free managed PostgreSQL with PostGIS for crop outbreak location mapping. |
| **TOTAL ESTIMATED COST** | **Production MVP** | **Combined Stack** | **~$16 – $45 / month** | **~$10 / year** | Highly cost-effective using ONNX CPU quantization; no expensive GPU server required for low-to-medium traffic! |

---

## 🛠️ Required Installed Software & Development Tooling

### Local Development Environment
- **Python**: 3.12.x
- **Node.js**: 20+ LTS & npm / pnpm (for Next.js / React frontend)
- **Docker Desktop**: Docker Engine 25+ & Docker Compose v2 (Multi-container orchestration)
- **Git & DVC**: Version Control CLI & Data Version Control for model artifacts
- **IDE**: Antigravity IDE / VS Code (with Python, PyTorch, Docker & React extensions)
- **Conda / Virtualenv**: `venv` or `poetry` for environment isolation

### Production Server Stack
- **OS**: Ubuntu 24.04 LTS (AWS EC2 / DigitalOcean Droplet)
- **Runtime**: ONNX Runtime / PyTorch C++ CPython Binding
- **Container Runtime**: Docker Engine + Docker Compose Production
- **Reverse Proxy & Security**: Nginx / Caddy + Let's Encrypt automated SSL
- **Database & Queue**: PostgreSQL 16 + Redis 7 + Celery Workers

---

## 🏗️ Architecture, Tradeoffs & MLOps Strategy

### 1. PyTorch vs. ONNX Runtime (Model Inference Tradeoff)
- **Decision**: Train models in PyTorch 2.x, but export and serve via **ONNX Runtime (CPU quantized INT8/FP16)**.
- **Why?**: 
  - Standard PyTorch model serving requires heavy PyTorch dependencies (~2GB RAM footprint) and expensive GPU cloud servers ($50+/mo).
  - Quantized ONNX Runtime runs 4x faster on standard 2-core CPU servers, cutting server hosting costs by 80% while preserving >98.5% diagnostic accuracy.

### 2. Explainable AI (XAI) with Grad-CAM Visual Heatmaps
- **Decision**: Integrate Grad-CAM (Gradient-weighted Class Activation Mapping) into the inference backend.
- **Why?**: Farmers & agronomists will not trust a "black box" prediction. Grad-CAM generates a visual heatmap over the input leaf image, highlighting exact spots of necrosis, mildew, or rust responsible for the diagnosis.

### 3. CI/CD & Automated Testing Architecture
- **GitHub Actions**: Free 2,000 build minutes/month for CI testing, linting (`flake8`, `black`, `eslint`), Pytest suite, and Docker container build verification on `git push`.

---

## 📊 Master Ticket Matrix & Progress Tracking

| Ticket ID | Title | Phase | Target Timeline | Dependencies | Status |
|---|---|---|---|---|---|
| `PD-1` | Repository Initialization & Multi-Container Docker Setup | Phase 1 | Day 1-2 | None | [ ] Pending |
| `PD-2` | Dataset Ingestion, Cleaning & DVC Pipeline Setup | Phase 1 | Day 3-4 | `PD-1` | [ ] Pending |
| `PD-3` | Automated CI/CD Quality Pipeline & Pre-commit Hooks | Phase 1 | Day 5 | `PD-1` | [ ] Pending |
| `PD-4` | PyTorch Deep Learning Model Training (MobileNetV4/EfficientNet) | Phase 2 | Day 6-8 | `PD-2` | [ ] Pending |
| `PD-5` | Model Optimization, ONNX Export & INT8 Quantization | Phase 2 | Day 9-10 | `PD-4` | [ ] Pending |
| `PD-6` | Explainable AI (XAI) Grad-CAM Visual Heatmap Engine | Phase 2 | Day 11-12 | `PD-4` | [ ] Pending |
| `PD-7` | MLflow Model Registry, Evaluation & Validation Pipeline | Phase 2 | Day 13-14 | `PD-5`, `PD-6` | [ ] Pending |
| `PD-8` | FastAPI Image Upload, Validation & Preprocessing Engine | Phase 3 | Day 15-16 | `PD-1`, `PD-5` | [ ] Pending |
| `PD-9` | Diagnostic Engine & Botanical Knowledge Base Integration | Phase 3 | Day 17-18 | `PD-8` | [ ] Pending |
| `PD-10` | PostgreSQL Schema, Scan History API & User Accounts | Phase 3 | Day 19-20 | `PD-8` | [ ] Pending |
| `PD-11` | Asynchronous Task Processing & Outbreak Location Mapping | Phase 3 | Day 21-22 | `PD-10` | [ ] Pending |
| `PD-12` | Next.js / Vite React Frontend Shell & Design System | Phase 4 | Day 23-24 | `PD-1` | [ ] Pending |
| `PD-13` | Interactive Leaf Scanner UI & Live Camera Stream Capture | Phase 4 | Day 25-26 | `PD-12` | [ ] Pending |
| `PD-14` | Diagnostic Report Dashboard & Grad-CAM Heatmap Viewer | Phase 4 | Day 27-28 | `PD-13`, `PD-9` | [ ] Pending |
| `PD-15` | Offline-First PWA Support & Multi-Language Localization | Phase 4 | Day 29-30 | `PD-14` | [ ] Pending |
| `PD-16` | API Security Hardening, CORS, Rate Limiting & Auth Audit | Phase 5 | Day 31-32 | `PD-10` | [ ] Pending |
| `PD-17` | Telemetry, Structured JSON Logging & Sentry Integration | Phase 5 | Day 33 | `PD-16` | [ ] Pending |
| `PD-18` | End-to-End Automated Testing Suite (Pytest & Playwright) | Phase 5 | Day 34-35 | `PD-14`, `PD-16` | [ ] Pending |
| `PD-19` | Production Infrastructure Provisioning (AWS / Docker Prod) | Phase 6 | Day 36-37 | `PD-1` | [ ] Pending |
| `PD-20` | Production Launch, Nginx SSL & Automated Deployment | Phase 6 | Day 38-40 | `PD-19` | [ ] Pending |

---

## 📋 Detailed Ticket Specifications & AI Agent Execution Prompts

### PHASE 1: Architecture, MLOps Foundation & Local Container Setup

#### `PD-1`: Repository Initialization & Multi-Container Docker Setup
- **Target**: Day 1-2 | **Dependencies**: None
- **Files**: `docker-compose.yml`, `backend/Dockerfile`, `frontend/Dockerfile`, `.env.example`, `requirements.txt`
- **Goal**: Establish a production-grade multi-container environment (FastAPI backend, Next.js/React frontend, PostgreSQL 16 DB, Redis cache, Worker).
- **Verification**: Running `docker-compose up --build` brings up backend at `http://localhost:8000/docs` and frontend at `http://localhost:3000`.
- **Agent Prompt**:
  > "Execute ticket PD-1: Initialize plant disease detection repository structure. Create docker-compose.yml containing services: backend (FastAPI), frontend (Next.js/React), db (PostgreSQL 16), and redis. Include backend/Dockerfile, frontend/Dockerfile, .env.example, and requirements.txt with FastAPI, uvicorn, torch, torchvision, pillow, opencv-python, pydantic. Verify clean docker startup."

#### `PD-2`: Dataset Ingestion, Cleaning & DVC Pipeline Setup
- **Target**: Day 3-4 | **Dependencies**: `PD-1`
- **Files**: `scripts/dataset_downloader.py`, `scripts/preprocess_dataset.py`, `dvc.yaml`, `.dvcignore`
- **Goal**: Automate PlantVillage (38 disease classes) & field dataset download, perform image quality filtering, resize/normalize leaf images, and initialize DVC tracking.
- **Verification**: `python scripts/preprocess_dataset.py` creates clean split (`train/val/test`) and `dvc status` reports no errors.
- **Agent Prompt**:
  > "Execute ticket PD-2: Create dataset ingestion and preprocessing scripts in scripts/ preprocess_dataset.py. Implement image filtering (remove corrupted/blurry files), train/val/test 80/10/10 split, image normalization to 224x224, and setup DVC pipeline in dvc.yaml."

#### `PD-3`: Automated CI/CD Quality Pipeline & Pre-commit Hooks
- **Target**: Day 5 | **Dependencies**: `PD-1`
- **Files**: `.github/workflows/ci.yml`, `.pre-commit-config.yaml`, `pyproject.toml`
- **Goal**: Setup GitHub Actions workflow for automated code formatting (`black`), linting (`flake8`, `ruff`), security scanning (`bandit`), and pytest execution.
- **Verification**: `git commit` triggers pre-commit hooks clean; GitHub Actions workflow succeeds.
- **Agent Prompt**:
  > "Execute ticket PD-3: Create .github/workflows/ci.yml and .pre-commit-config.yaml enforcing black, ruff, bandit security analysis, and pytest run on git push."

---

### PHASE 2: Deep Learning Model Architecture, Training & Explainability (XAI)

#### `PD-4`: PyTorch Deep Learning Model Training (MobileNetV4 / EfficientNet)
- **Target**: Day 6-8 | **Dependencies**: `PD-2`
- **Files**: `ml/models/leaf_classifier.py`, `ml/train.py`, `ml/config.yaml`
- **Goal**: Build PyTorch transfer learning model (MobileNetV4/EfficientNet-V2) targeting >98% accuracy on 38 plant disease classes. Include validation metrics (Precision, Recall, F1-Score).
- **Verification**: `python ml/train.py` outputs trained model checkpoint `best_model.pth` with evaluation metrics.
- **Agent Prompt**:
  > "Execute ticket PD-4: Build PyTorch deep learning classification pipeline in ml/models/leaf_classifier.py and ml/train.py. Use transfer learning with EfficientNet-V2 / MobileNetV4. Implement data augmentations (rotation, flip, color jitter), loss function, AdamW optimizer, and validation F1-score tracking."

#### `PD-5`: Model Optimization, ONNX Export & INT8 Quantization
- **Target**: Day 9-10 | **Dependencies**: `PD-4`
- **Files**: `ml/export_onnx.py`, `ml/quantize_onnx.py`
- **Goal**: Convert PyTorch `.pth` checkpoint to ONNX format and apply INT8 dynamic quantization for ultra-fast CPU inference (<50ms per leaf scan).
- **Verification**: `python ml/export_onnx.py` generates `model_quantized.onnx`; benchmark script confirms >3x speedup with <0.5% accuracy loss.
- **Agent Prompt**:
  > "Execute ticket PD-5: Implement ONNX export and INT8 quantization script in ml/export_onnx.py. Measure inference latency comparing PyTorch vs ONNX Runtime CPU execution."

#### `PD-6`: Explainable AI (XAI) Grad-CAM Visual Heatmap Engine
- **Target**: Day 11-12 | **Dependencies**: `PD-4`
- **Files**: `ml/explainability/gradcam.py`
- **Goal**: Implement Grad-CAM class activation mapping to extract feature maps from the final convolutional layer, overlaying visual heatmaps onto original leaf images to highlight diseased spots.
- **Verification**: `pytest tests/test_gradcam.py` outputs blended heatmap image array matching input image dimensions.
- **Agent Prompt**:
  > "Execute ticket PD-6: Implement Grad-CAM module in ml/explainability/gradcam.py. Calculate gradients w.r.t target disease class, generate heatmap activation, overlay onto original RGB leaf image, and return base64 / image buffer."

#### `PD-7`: MLflow Model Registry, Evaluation & Validation Pipeline
- **Target**: Day 13-14 | **Dependencies**: `PD-5`, `PD-6`
- **Files**: `ml/evaluate.py`, `mlflow.yaml`
- **Goal**: Integrate MLflow tracking to log hyperparameters, confusion matrices, F1-scores, and register model artifacts automatically.
- **Verification**: Running evaluation script logs run artifacts to local MLflow dashboard.
- **Agent Prompt**:
  > "Execute ticket PD-7: Integrate MLflow logging in ml/evaluate.py. Log training loss, confusion matrix, ROC curves, ONNX latency, and register best model in MLflow model registry."

---

### PHASE 3: Robust FastAPI Backend & Botanical Knowledge Engine

#### `PD-8`: FastAPI Image Upload, Validation & Preprocessing Engine
- **Target**: Day 15-16 | **Dependencies**: `PD-1`, `PD-5`
- **Files**: `backend/app/main.py`, `backend/app/api/v1/predict.py`, `backend/app/services/onnx_service.py`
- **Goal**: Build high-performance FastAPI endpoint `/api/v1/predict` accepting JPEG/PNG/WebP leaf uploads, checking image file integrity, resizing, and running ONNX model inference.
- **Verification**: POST request with sample leaf image returns JSON response with top-3 disease predictions and confidence scores in <100ms.
- **Agent Prompt**:
  > "Execute ticket PD-8: Implement FastAPI prediction endpoint in backend/app/api/v1/predict.py. Validate MIME types, handle file streaming, load ONNX model via Singleton ONNX Runtime session, and return JSON prediction response."

#### `PD-9`: Diagnostic Engine & Botanical Knowledge Base Integration
- **Target**: Day 17-18 | **Dependencies**: `PD-8`
- **Files**: `backend/app/data/diseases.json`, `backend/app/services/diagnosis_service.py`
- **Goal**: Map disease prediction labels to rich diagnostic data (Common Name, Scientific Name, Symptoms, Organic Remedies, Chemical Treatments, Prevention Protocol).
- **Verification**: API prediction response contains complete treatment guide and severity level.
- **Agent Prompt**:
  > "Execute ticket PD-9: Create botanical knowledge base backend/app/data/diseases.json covering all 38 plant disease classes. Connect prediction output to detailed symptoms, biological control, chemical pesticides, and preventive care tips."

#### `PD-10`: PostgreSQL Schema, Scan History API & User Accounts
- **Target**: Day 19-20 | **Dependencies**: `PD-8`
- **Files**: `backend/app/db/models.py`, `backend/app/api/v1/scans.py`, `backend/app/api/v1/auth.py`
- **Goal**: Implement User authentication (JWT) and database models for storing scan history (timestamp, crop type, diagnosed disease, confidence, image storage key).
- **Verification**: `pytest tests/test_scans.py` passes user registration, scan creation, and history pagination tests.
- **Agent Prompt**:
  > "Execute ticket PD-10: Create SQLAlchemy models for User, ScanRecord, Disease, and CropLocation. Implement CRUD routes for user scan history and authentication in backend/app/api/v1/."

#### `PD-11`: Asynchronous Task Processing & Outbreak Location Mapping
- **Target**: Day 21-22 | **Dependencies**: `PD-10`
- **Files**: `backend/app/workers/tasks.py`, `backend/app/api/v1/outbreaks.py`
- **Goal**: Setup Celery/Redis background task queue for heavy image processing and build geo-heatmap API endpoint showing crop disease outbreak clusters by location coordinates.
- **Verification**: Outbreak endpoint returns GeoJSON feature collection of recent crop disease detections.
- **Agent Prompt**:
  > "Execute ticket PD-11: Implement Celery task queue in backend/app/workers/tasks.py for background image archival. Build GeoJSON outbreak map endpoint in backend/app/api/v1/outbreaks.py."

---

### PHASE 4: Modern Production Web Application UI/UX

#### `PD-12`: Next.js / React Frontend Shell & Design System
- **Target**: Day 23-24 | **Dependencies**: `PD-1`
- **Files**: `frontend/src/app/layout.tsx`, `frontend/src/styles/globals.css`, `frontend/tailwind.config.js`
- **Goal**: Create modern responsive UI design system with botanical green palette, glassmorphism card components, and dark/light theme support.
- **Verification**: Desktop and mobile preview render styled components cleanly.
- **Agent Prompt**:
  > "Execute ticket PD-12: Build Next.js / React frontend shell with TailwindCSS design system. Define custom CSS variables for agricultural color theme, glassmorphic cards, responsive typography, and navigation bar."

#### `PD-13`: Interactive Leaf Scanner UI & Live Camera Stream Capture
- **Target**: Day 25-26 | **Dependencies**: `PD-12`
- **Files**: `frontend/src/components/LeafScanner.tsx`, `frontend/src/components/CameraCapture.tsx`
- **Goal**: Build file upload dropzone + live webcam/mobile camera capture UI with real-time leaf positioning overlay and client-side image preview.
- **Verification**: User can take picture via webcam or upload file, seeing instant preview before submission.
- **Agent Prompt**:
  > "Execute ticket PD-13: Implement LeafScanner component with drag-and-drop image upload and HTML5 MediaDevices camera capture stream. Include leaf alignment bounding box guide."

#### `PD-14`: Diagnostic Report Dashboard & Grad-CAM Heatmap Viewer
- **Target**: Day 27-28 | **Dependencies**: `PD-13`, `PD-9`
- **Files**: `frontend/src/components/DiagnosticReport.tsx`, `frontend/src/components/HeatmapViewer.tsx`
- **Goal**: Create interactive diagnostic report page featuring confidence bar gauges, side-by-side original image vs Grad-CAM visual heatmap toggle, organic/chemical remedy tabs, and PDF export button.
- **Verification**: Uploading leaf displays complete interactive diagnostic dashboard with Grad-CAM heatmap view.
- **Agent Prompt**:
  > "Execute ticket PD-14: Build DiagnosticReport UI component displaying disease name, confidence badge, Grad-CAM visual heatmap overlay slider, treatment recommendations tabbed view, and PDF export functionality."

#### `PD-15`: Offline-First PWA Support & Multi-Language Localization
- **Target**: Day 29-30 | **Dependencies**: `PD-14`
- **Files**: `frontend/public/manifest.json`, `frontend/src/i18n/`, `frontend/src/sw.js`
- **Goal**: Configure Progressive Web App (PWA) with service worker caching for offline access in remote agricultural areas, plus multi-language translation (English, Hindi, Spanish).
- **Verification**: PWA audit in Chrome Lighthouse scores >90 for PWA & Accessibility.
- **Agent Prompt**:
  > "Execute ticket PD-15: Setup Progressive Web App manifest and Service Worker caching in frontend. Integrate i18next localization supporting multi-language switching."

---

### PHASE 5: Security Hardening, Audit & Team Debuggability

#### `PD-16`: API Security Hardening, CORS, Rate Limiting & Auth Audit
- **Target**: Day 31-32 | **Dependencies**: `PD-10`
- **Files**: `backend/app/core/security.py`, `backend/app/middleware/rate_limit.py`
- **Goal**: Implement OWASP security hardening: HTTP rate limiting (`slowapi`), strict CORS origin headers, input payload size caps (max 10MB image), and Gitleaks secret scanning.
- **Verification**: Sending >60 requests/min triggers HTTP 429 Too Many Requests; security scanner reports zero vulnerabilities.
- **Agent Prompt**:
  > "Execute ticket PD-16: Implement rate limiting middleware, payload size validation, JWT token expiration, and security headers in FastAPI backend."

#### `PD-17`: Telemetry, Structured JSON Logging & Sentry Integration
- **Target**: Day 33 | **Dependencies**: `PD-16`
- **Files**: `backend/app/core/logging.py`
- **Goal**: Configure structured JSON logging (`structlog`), request tracking correlation IDs, and Sentry exception monitoring for production debugging.
- **Verification**: Backend logs format as valid JSON lines with correlation IDs.
- **Agent Prompt**:
  > "Execute ticket PD-17: Configure structlog for JSON formatted logging in FastAPI backend. Add request ID tracing middleware and Sentry SDK integration."

#### `PD-18`: End-to-End Automated Testing Suite (Pytest & Playwright)
- **Target**: Day 34-35 | **Dependencies**: `PD-14`, `PD-16`
- **Files**: `tests/unit/`, `tests/integration/`, `tests/e2e/`
- **Goal**: Build comprehensive test suite covering ML inference accuracy, FastAPI endpoints, database transactions, and Playwright UI browser flows.
- **Verification**: `pytest` passes all backend tests; `npx playwright test` passes end-to-end browser scanning flows.
- **Agent Prompt**:
  > "Execute ticket PD-18: Write comprehensive test suite: unit tests for ONNX model inference & Grad-CAM, FastAPI API integration tests, and Playwright E2E UI scanner test."

---

### PHASE 6: Production Infrastructure Provisioning & Scalable Deployment

#### `PD-19`: Production Infrastructure Provisioning (AWS / Docker Prod)
- **Target**: Day 36-37 | **Dependencies**: `PD-1`
- **Files**: `infra/docker-compose.prod.yml`, `infra/terraform/` (optional)
- **Goal**: Configure production Docker Compose with environment secrets, Cloudflare R2 / AWS S3 storage backend, and managed database connections.
- **Verification**: `docker-compose -f infra/docker-compose.prod.yml config` passes validation without missing environment variables.
- **Agent Prompt**:
  > "Execute ticket PD-19: Create docker-compose.prod.yml with production environment variable placeholders, Cloudflare R2 / S3 storage backend configuration, and healthcheck monitors."

#### `PD-20`: Production Launch, Nginx SSL & Automated Deployment
- **Target**: Day 38-40 | **Dependencies**: `PD-19`
- **Files**: `infra/nginx/nginx.conf`, `.github/workflows/deploy.yml`
- **Goal**: Setup Nginx reverse proxy container with HTTP/2, Gzip/Brotli compression, Let's Encrypt SSL, and GitHub Actions zero-downtime SSH deploy script.
- **Verification**: Pushing to `main` branch deploys to production cloud server with valid SSL certificate (`https://`).
- **Agent Prompt**:
  > "Execute ticket PD-20: Configure production Nginx reverse proxy with SSL termination and Gzip compression. Create GitHub Actions CD workflow in .github/workflows/deploy.yml to execute zero-downtime server deployments."

---

## 📝 Developer Change Log & Execution History

| Date | Ticket ID | Summary of Changes | Author / Agent |
|---|---|---|---|
| 2026-08-04 | `PD-0` | Created initial SDLC Master Roadmap and AI Agent Execution Protocol | Antigravity AI |
