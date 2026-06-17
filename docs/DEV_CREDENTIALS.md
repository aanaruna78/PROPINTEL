# 🔐 PROPINTEL — Dev & Test Credentials

> **⚠️ For local development and testing ONLY.**
> These credentials exist purely in the mock in-memory store (`deps.py`).
> They are never seeded into production databases.

---

## ⚙️ Optional Environment Variables

Create a `backend/.env` file to enable production AI features locally:

```env
# AI District Summaries (STORY-05-004)
# Without this key: high-quality deterministic template summaries are used.
# With this key: live OpenAI gpt-4o-mini summaries are generated per district.
OPENAI_API_KEY=sk-...
```

> **In dev (no key set):** The `GET /api/v1/analytics/districts/{district}/ai-summary` endpoint returns templated summaries automatically. The response includes `"powered_by": "template"`. No mocking or stubbing is required — the fallback is built-in.

---

## 🧑‍💼 Mock User Accounts

All accounts use password: **`password123`**

| Full Name         | Email                        | Role              | Tenant     | Mobile          |
|-------------------|------------------------------|-------------------|------------|-----------------|
| Alice Admin       | `admin@propintel.ai`         | `admin`           | propintel  | +65 9777 8888   |
| Marcus Manager    | `manager@propintel.ai`       | `agency_manager`  | propintel  | +65 9666 7777   |
| Aiden Buyer       | `buyer@propintel.ai`         | `buyer`           | propintel  | +65 9111 2222   |
| Sarah Seller      | `seller@propintel.ai`        | `seller`          | propintel  | +65 9222 3333   |
| Ian Investor      | `investor@propintel.ai`      | `investor`        | propintel  | +65 9444 5555   |
| Toby Tenant       | `tenant@propintel.ai`        | `tenant`          | propintel  | +65 9333 4444   |
| Lucas Landlord    | `landlord@propintel.ai`      | `landlord`        | propintel  | +65 9555 6666   |
| Developer User    | `dev@propintel.ai`           | `admin`           | propintel  | +65 9123 4567   |
| Gmail Buyer       | `user.buyer@gmail.com`       | `buyer`           | propintel  | +65 8111 2222   |
| Gmail Seller      | `user.seller@gmail.com`      | `seller`          | propintel  | +65 8222 3333   |

---

## 🪄 Dynamic Email Pattern

Any email matching `*@propintel.ai` with password `password123` will be auto-resolved.
The role is inferred from the email prefix:

| Email prefix contains | Assigned role      |
|-----------------------|--------------------|
| `admin`               | `admin`            |
| `manager`             | `agency_manager`   |
| `buyer`               | `buyer`            |
| `seller`              | `seller`           |
| `investor`            | `investor`         |
| `tenant`              | `tenant`           |
| `landlord`            | `landlord`         |
| *(anything else)*     | `buyer` (default)  |

**Example:** `john.seller@propintel.ai` / `password123` → logs in as `seller`.

---

## 📱 OTP Login

Mock OTP code (always accepted): **`123456`**

Works for both email and phone number inputs on the OTP login screen.

---

## 🔑 Password Reset

Mock reset code (always accepted): **`654321`**

1. Enter any `@propintel.ai` email on the Forgot Password screen
2. When prompted for a code, enter `654321`
3. Set the new password

---

## 🏢 Mock Tenants

| Tenant ID   | Name            | Domain                   | Primary Colour |
|-------------|-----------------|--------------------------|----------------|
| `propintel` | PropIntel HQ    | `propintel.ai`           | `#4338ca`      |
| `era`       | ERA Singapore   | `era.propintel.ai`       | `#ff0000`      |

---

## 🛠️ Dev Notes

- **Backend API:** `http://localhost:8000`
- **Frontend:** `http://localhost:3000`
- **Swagger / OpenAPI docs:** `http://localhost:8000/docs`
- **JWT secret (local):** `super_secret_propintel_key_123_abc_xyz`
- **Token lifetime:** 7 days (access), 7 days (refresh) — for dev convenience
- **bcrypt version required:** `4.0.1` (passlib 1.7.4 is incompatible with bcrypt 5.x)

---

## 🧪 Running Tests

```bash
# Backend (pytest)
cd backend && pytest -v

# Frontend (vitest)
cd frontend && npm test
```

> Last updated: June 2026
