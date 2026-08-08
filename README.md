# ClinicIQ

An agentic AI platform for clinical document triage: patients/staff upload medical documents (labs, imaging, allergy records), and a multi-agent system extracts structured findings, routes the case to the right specialty, and answers questions through a role-aware chat interface (patient / doctor / radiologist / admin each see different levels of detail).

Originally built as a PwC Agentic AI capstone project.

## Table of Contents

- [How It Works](#how-it-works)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Clone the repo](#1-clone-the-repo)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [Environment Variables](#environment-variables)
- [API Overview](#api-overview)
- [Status](#status)
- [Author](#author)

## How It Works

1. A document (lab report, imaging report, allergy record, etc.) is uploaded and ingested — text is extracted (`pdfplumber`/`python-docx`), and named-entity recognition pulls out clinical entities.
2. The document is embedded and indexed (ChromaDB) and added to a knowledge graph (`networkx`) linking entities and documents.
3. A query is classified into a medical specialty (e.g. Hematology, Cardiology, Radiology) using keyword + embedding-based classification, and routed accordingly.
4. An **orchestrator** dispatches the case to specialized agents as needed:
   - `LabInterpreterAgent` — interprets lab results
   - `RadiologyAnalyzerAgent` — interprets imaging reports
   - `AllergySafetyAgent` — checks for allergy/safety concerns
5. Responses are filtered by role before being returned — a patient gets a plain-language summary, a doctor gets full clinical detail, a radiologist gets imaging-focused output, and admins see everything.
6. All LLM calls are traced via Langfuse for observability/evaluation.

## Features

- **Document upload & ingestion** — PDF/DOCX parsing, clinical NER, vector indexing
- **Specialty routing** — classifies incoming queries/documents into the right medical specialty
- **Multi-agent interpretation** — dedicated agents for labs, radiology, and allergy safety, coordinated by an orchestrator
- **Role-aware chat** — the same underlying data, filtered differently for patient / doctor / radiologist / admin
- **Knowledge graph** — entities and documents linked via `networkx` for cross-document context
- **LLM observability** — Langfuse tracing and scoring on agent calls
- **Auth & admin** — JWT-based auth, admin panel

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI |
| LLM | OpenAI, LangChain |
| Vector DB | ChromaDB, sentence-transformers |
| Knowledge graph | NetworkX |
| Observability | Langfuse |
| Database | Supabase |
| Document parsing | pdfplumber, python-docx |
| Auth | JWT (python-jose, passlib/bcrypt) |
| Frontend | React, TypeScript, Vite |
| Deployment | Render (backend), Vercel (frontend) |

## Project Structure

```
backend/
  agents/            # base_agent, lab_agent, radiology_agent, allergy_agent, orchestrator
  pipelines/         # ingestion.py (document parsing), ner.py (clinical entity extraction)
  services/          # chroma, knowledge_graph, routing_engine, classifier, langfuse_client,
                      # supabase_client, role_filter, email
  routers/           # auth, upload, query, routing, chat, radiologist, admin, reports, dashboard
  middleware/         # auth middleware
  main.py            # FastAPI app entrypoint
frontend/
  src/               # React + TypeScript UI
```

## Prerequisites

- Python 3.11 (pinned — see deployment notes below)
- Node.js 18+
- A Supabase project
- An OpenAI API key
- (Optional) A Langfuse account, for LLM tracing

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/ubaidmuazzam23-lgtm/ClinicIQ.git
cd ClinicIQ
```

### 2. Backend

```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

pip install -r requirements.txt

cp .env.example .env            # fill in Supabase, OpenAI, Langfuse credentials

uvicorn main:app --reload
```

Health check at `http://localhost:8000/health`.

**Note:** `requirements.txt` pins a CPU-only build of PyTorch and `numpy<2` — these version pins came from real deployment fixes (see commit history) for compatibility on Render's build environment.

### 3. Frontend

```bash
cd frontend
npm install

# Create a .env with VITE_API_URL pointing at the backend

npm run dev
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | ✅ | Powers agent reasoning and chat |
| `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` | ✅ | Database and storage |
| `JWT_SECRET` | ✅ | Auth token signing |
| `CHROMA_PERSIST_PATH` | Optional | Local ChromaDB storage path |
| `LANGFUSE_SECRET_KEY` / `LANGFUSE_PUBLIC_KEY` / `LANGFUSE_HOST` | Optional | Enables LLM call tracing |
| `GMAIL_SENDER` / `GMAIL_APP_PASSWORD` | Optional | Email notifications |
| `FRONTEND_URL` | Optional | CORS origin |
| `PORT` | Optional | Default depends on deployment target |
| `ENVIRONMENT` | Optional | `development` \| `production` |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` / `VITE_API_BASE_URL` | ✅ | Backend base URL |

## API Overview

| Prefix | Purpose |
|---|---|
| `/auth` | Authentication |
| `/upload` | Document upload and ingestion |
| `/query` | Query the knowledge base |
| `/routing` | Specialty classification/routing |
| `/chat` | Role-aware chat interface |
| `/radiologist` | Radiologist-specific workflow |
| `/admin` | Admin panel |
| `/reports`, `/dashboard` | Reporting (early-stage) |

## Status

Academic capstone project (PwC Agentic AI program). `reports` and `dashboard` routers are early-stage/placeholder; the core upload → route → multi-agent interpretation → role-aware chat flow is the fully built path.

## Author

[Ubaid Muazzam](https://github.com/ubaidmuazzam23-lgtm)
