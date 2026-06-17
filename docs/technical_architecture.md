# PROPINTEL AI Technical Document

## 1. Purpose
PROPINTEL AI is a SaaS-based AI real estate intelligence platform designed for the Singapore property market. The technical platform must deliver:
- Fast and responsive user experience
- Highly attractive and premium UI
- AI-first conversational interaction
- Real-time property intelligence
- Secure SaaS architecture

## 2. Recommended Tech Stack

### 5.1 Frontend
- **Stack:** Next.js, React, TypeScript, Tailwind CSS, ShadCN UI, Framer Motion, Recharts.
- **Reasoning:** Fast, SEO-friendly, premium UI capabilities, scalable.

### 5.2 Backend
- **Stack:** Python FastAPI, PostgreSQL, Redis, Kafka/Redpanda, Celery/Temporal, SQLAlchemy.
- **Reasoning:** FastAPI is excellent for AI-heavy services. PostgreSQL handles structured data. Redis for caching and fast rankings.

### 5.3 AI / ML Stack
- **Stack:** Python, LangGraph / CrewAI, OpenAI / Anthropic, LlamaIndex, pgvector, Scikit-learn.
- **Capabilities:** Best buy/sell prediction, matchmaking, negotiation probability, document understanding.
- **Implemented (STORY-05-004):** OpenAI `gpt-4o-mini` via the `openai` Python SDK for district AI summaries. Falls back to deterministic template summaries when `OPENAI_API_KEY` is not set. Configured via `backend/app/services/ai_summary_service.py`.

### 5.4 Data Platform
- **Stack:** PostgreSQL (with TimescaleDB/PostGIS), dbt, Apache Airflow, ElasticSearch, Vector DB.

### 5.5 Cloud & DevOps
- **Stack:** AWS / Azure, Kubernetes, Docker, GitHub Actions, Vercel (for frontend MVP).

## 6. High-Level Architecture
The platform follows a modular SaaS microservices architecture:
1. User Experience Layer
2. API Gateway Layer
3. SaaS Identity & Tenant Layer
4. Core Business Microservices
5. AI Agent Orchestration Layer
6. Data Intelligence Layer

## 7. Microservices Overview
- **API Gateway Service:** Kong / NGINX / Cloud native API Gateway.
- **Identity Service:** Auth, RBAC, Multi-tenant management.
- **Property Data Service:** Master data, Geo queries (PostGIS).
- **Listing Service:** Listing validation and deduplication.
- **Market Intelligence Service:** District scoring, sentiment index, opportunity alert engine, and live market pulse.
  - `pulse_service.py` — Derives `MarketPulseResponse` (URA index proxy, rental yield, momentum, rising/cooling counts, top mover) and role-filtered `OpportunityAlert` lists from `DistrictMonthlyStats`.
  - `ai_summary_service.py` — Generates 2–3 sentence AI district summaries via OpenAI `gpt-4o-mini` (template fallback in dev).
  - **Alert types by role:** buyers see price dips / hot streaks / cooling warnings; sellers see hot streaks / high demand; investors see all signals; landlords see rental surges / cooling; tenants see rental surges only; admins and agency managers see all.
- **Valuation Service:** Fair market value estimation.
- **Best Buy/Sell Prediction Services:** Scoring models for ROI and timing.
- **Matchmaking Service:** Buyer-seller alignment algorithms.
- **Negotiation Intelligence Service:** Offer strategy and counter-offer simulations.
- **Document Intelligence Service:** OCR and LLM clause extraction (OTPs, Tenancy agreements).
- **AI Agent Orchestration Service:** LangGraph coordinators managing user intent.

## 10. SaaS Platform Design
- **Multi-Tenant Architecture:** Shared database with `tenant_id` for MVP, supporting individuals, agencies, and enterprises.
- **Subscription Gates:** Free vs Premium insights and API usage metering.

## 12. Core Screens (UX Shift)
1. **Omni-Dashboard:** Intent-driven input replacing photo grids.
2. **Best Buy Analytics:** Probability data replacing agent narratives.
3. **Autonomous Matchmaking:** Systemic alignment replacing spam.
4. **AI Negotiation War Room:** Game theory replacing blind phone calls.
5. **Document Intelligence:** Risk-free comprehension replacing blind signing.

## 13. Implemented Features (Current Dev State)

### STORY-05-004 — Market Pulse Dashboard
| Component | Location | Description |
|---|---|---|
| `GET /api/v1/analytics/market-pulse` | `analytics.py` | Live URA index proxy, rental yield, momentum, top mover |
| `GET /api/v1/analytics/alerts` | `analytics.py` | Up to 5 role-filtered opportunity alerts |
| `GET /api/v1/analytics/districts/{d}/ai-summary` | `analytics.py` | AI-generated 2–3 sentence district summary |
| `MarketPulseWidget` | `frontend/src/components/dashboard/` | Live market pulse with momentum badge |
| `InsightsWidget` | `frontend/src/components/dashboard/` | Role-filtered alert cards |
| AI Summary panel | `frontend/src/app/districts/page.tsx` | Inline summary on district selection |
