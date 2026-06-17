# PROPINTEL AI 🏢🤖

> **An AI-Native Real Estate Intelligence & Predictive Transaction Ecosystem**

PROPINTEL AI is a next-generation SaaS platform designed to shift the Singapore real estate industry from "listing-driven discovery" to "intelligence-driven transactions." It provides predictive insights into market liquidity, valuation trends, and investment risks, empowering buyers, sellers, tenants, and investors to make data-driven property decisions.

## 🌟 Key Features

- **AI-Powered Best Buy & Sell Engines:** Spot undervalued listings, forecast capital gains, and identify optimal exit windows based on millions of data points.
- **Market Pulse Dashboard *(STORY-05-004)*:** Live district movement indicators, role-filtered opportunity alerts (price dips, hot streaks, rental surges), and AI-generated district summaries powered by OpenAI `gpt-4o-mini`.
- **Autonomous Matchmaking:** Directly connect verified buyers/sellers and tenants/landlords based on lifestyle alignment, budget, and financial compatibility.
- **AI Negotiation War Room:** Predict seller urgency and buyer pressure to suggest effective offer strategies, counter-offers, and walkaway prices.
- **Document Intelligence:** Automate the comprehension of complex workflows (OTPs, Tenancy Agreements, Stamp Duty calculations) to highlight risks and missing fields.
- **Omni-Dashboard:** Replace traditional photo-heavy grids with an intent-driven chat and analytics interface.

## 🏗️ Technical Architecture

The platform follows a modular SaaS microservices architecture:

- **Frontend (Omni-Dashboard):** Next.js 15, React, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion.
- **Backend (Core Services):** Python FastAPI, SQLAlchemy.
- **AI/Data Layer:** LangGraph/CrewAI for agent orchestration, OpenAI/Anthropic LLMs, PostgreSQL with `pgvector`/PostGIS, Redis caching.
- **Infrastructure:** Docker Compose (local dev), designed for future Kubernetes (production) deployment on AWS/Azure/GCP.

## 🚀 Getting Started (Local Development)

### Prerequisites
- Docker & Docker Compose
- Node.js (v18+)
- Python (3.10+)

### 1. Start Infrastructure (PostgreSQL & Redis)
Ensure Docker is running, then start the databases:
```bash
docker compose up -d
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The Omni-Dashboard will be available at [http://localhost:3000](http://localhost:3000).

### 3. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The FastAPI documentation will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

### 4. Environment Variables (Optional)
Create a `.env` file in `backend/` to enable production AI features:
```env
# Enables OpenAI gpt-4o-mini for live district AI summaries.
# Without this key, the system uses high-quality deterministic template summaries.
OPENAI_API_KEY=sk-...
```
> See `docs/DEV_CREDENTIALS.md` for the full list of mock test accounts and local dev setup.

## 🧪 Automated Testing

### Backend Unit Tests (FastAPI + Pytest)
The backend test suite covers authentication flows, Role-Based Access Control (RBAC) route security, tenant resolution and data isolation, using SQLite in-memory databases.

```bash
cd backend
source .venv/bin/activate  # Activate virtual environment
pytest
```

### Frontend Unit Tests (Next.js + Vitest + Happy-DOM)
The frontend test suite covers rendering, loading, error states, and role-scoped metrics display logic for React/Next.js dashboard widgets.

```bash
cd frontend
npm run test
```

## 🗺️ Roadmap
- **Phase 1:** MVP Intelligence Platform (SaaS Foundation, Omni-Dashboard, Best Buy Score, AI Advisor, Document Intelligence)
- **Phase 2:** Predictive Intelligence (Best Sell Prediction, Rental Intelligence, Matchmaking Engine, Alert Engine)
- **Phase 3:** Transaction Enablement (Offer Management, Document Workflows, Viewing Scheduler)
- **Phase 4:** SaaS Expansion (Agency SaaS, Investor Portfolio Dashboard, Regional Expansion)

## 🔐 Security & Compliance
Built with security from day one, incorporating JWT/OAuth, RBAC, tenant isolation, PII masking, AI prompt injection protection, and PDPA-aligned data handling for the Singapore market.
