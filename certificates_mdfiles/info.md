# LINGAP — Project Overview & Developer Guide

**LINGAP** stands for **Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection.**

It is a transparent, blockchain-backed aid management platform. Donations are routed through **Stellar Soroban smart contracts**, all transactions are recorded on-chain for full auditability, and a web dashboard lets admins manage beneficiaries and track aid distribution.

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                     USER BROWSER                       │
│              Next.js 14 Frontend (port 3000)           │
└───────────────────────┬────────────────────────────────┘
                        │ HTTP / REST
┌───────────────────────▼────────────────────────────────┐
│              FastAPI Backend (port 8000)                │
│   Auth · Donations · Beneficiaries · Aid Requests      │
│   Dashboard · Stellar (Soroban contract calls)         │
└──────────┬─────────────────────────┬───────────────────┘
           │ SQLAlchemy (asyncpg)     │ stellar-sdk
┌──────────▼──────────┐   ┌──────────▼──────────────────┐
│  PostgreSQL DB       │   │  Stellar Testnet (Soroban)  │
│  (port 5432)         │   │  3 Smart Contracts (Rust)   │
└─────────────────────┘   └─────────────────────────────┘
```

### Three-Layer Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14, TypeScript, TailwindCSS | Admin dashboard & public UI |
| **Backend** | FastAPI, SQLAlchemy, PostgreSQL | REST API, business logic, DB |
| **Blockchain** | Stellar Soroban (Rust contracts) | On-chain donation vault, aid provenance, beneficiary registry |

---

## Repository Structure

```
LINGAP/
├── frontend/          # Next.js 14 app (TypeScript + Tailwind)
│   └── src/
│       ├── app/       # Pages (dashboard, donations, beneficiaries, aid-requests, reports, login)
│       ├── components/# Reusable UI components
│       ├── hooks/     # Custom React hooks
│       ├── lib/       # API client (axios)
│       ├── store/     # Zustand state management
│       └── types/     # TypeScript type definitions
│
├── backend/           # FastAPI Python app
│   ├── app/
│   │   ├── main.py         # App entry point, CORS, lifespan
│   │   ├── config.py       # Settings loaded from .env
│   │   ├── api/v1/         # Route handlers
│   │   │   ├── auth.py         # Login / JWT
│   │   │   ├── donations.py    # Donation CRUD
│   │   │   ├── beneficiaries.py# Beneficiary CRUD
│   │   │   ├── aid_requests.py # Aid request workflows
│   │   │   ├── dashboard.py    # Stats & summary
│   │   │   └── stellar.py      # Soroban contract interactions
│   │   ├── models/         # SQLAlchemy ORM models
│   │   ├── schemas/        # Pydantic request/response schemas
│   │   ├── core/           # Database init, security helpers
│   │   └── stellar/        # Stellar SDK client & Soroban helpers
│   ├── Dockerfile
│   └── requirements.txt
│
├── contracts/         # Rust/Soroban smart contracts (Stellar blockchain)
│   ├── donation_vault/         # Holds donated funds in escrow
│   ├── beneficiary_registry/   # On-chain registry of beneficiaries
│   └── aid_provenance/         # Tracks and logs aid disbursements
│
├── docker-compose.yml # Runs all 3 services together
└── .env.example       # Template for required environment variables
```

---

## How the System Works (Data Flow)

### 1. Donation Flow
1. A donor visits the frontend and submits a donation.
2. The frontend calls `POST /api/v1/donations` on the backend.
3. The backend records the donation in PostgreSQL.
4. The backend calls the **Donation Vault Soroban contract** on Stellar testnet to lock funds on-chain.
5. The transaction hash is stored in the DB for full traceability.

### 2. Aid Request Flow
1. An admin registers a **beneficiary** via the dashboard (`/beneficiaries`).
2. The beneficiary is recorded in the **Beneficiary Registry** smart contract on-chain.
3. An **aid request** is submitted (`/aid-requests`).
4. Once approved, funds are released from the Donation Vault and logged in the **Aid Provenance** contract.
5. Every disbursement is permanently recorded on Stellar — immutable and auditable.

### 3. Authentication
- Uses **JWT tokens** (via `python-jose`).
- Login via `POST /api/v1/auth/login`.
- Protected routes require a `Bearer <token>` header.
- Token expiry is configurable via `ACCESS_TOKEN_EXPIRE_MINUTES` (default: 1440 min = 24 hours).

### 4. Dashboard
- `GET /api/v1/dashboard` returns aggregate stats: total donations, total beneficiaries, pending aid requests, etc.
- The frontend renders this as charts using **Recharts**.

---

## Smart Contracts (Rust / Soroban)

Located in `contracts/`. Built as a Cargo workspace with three members:

| Contract | Purpose |
|---|---|
| `donation_vault` | Escrow contract — holds XLM donations, releases on approval |
| `beneficiary_registry` | Stores verified beneficiary addresses on-chain |
| `aid_provenance` | Immutable log of every aid disbursement |

Deployed contract address (Donation Vault on testnet):
```
CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP
```
Explorer: https://stellar.expert/explorer/testnet/contract/CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP

---

## Prerequisites

Before running the project, make sure you have:

- **Docker Desktop** installed and running
- **Node.js 18+** (for running frontend locally without Docker)
- **Python 3.12+** (for running backend locally without Docker)
- **Rust + Soroban CLI** (only if you need to compile/redeploy contracts)

---

## Running the Project

### Option A — Docker (Recommended, runs everything)

This starts PostgreSQL, the FastAPI backend, and the Next.js frontend all at once.

**Step 1: Set up environment variables**
```bash
# Copy the example env file
cp .env.example backend/.env

# Edit backend/.env and fill in:
# - STELLAR_SOURCE_SECRET_KEY=S...   (your Stellar testnet secret key)
# - CONTRACT_AID_PROVENANCE=C...
# - CONTRACT_BENEFICIARY_REGISTRY=C...
# (Donation Vault address is already filled in)
```

**Step 2: Start all services**
```bash
docker-compose up --build
```

**Step 3: Access the app**
| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| Health Check | http://localhost:8000/health |

To stop:
```bash
docker-compose down
```

To stop and wipe the database volume:
```bash
docker-compose down -v
```

---

### Option B — Run Services Manually (without Docker)

#### 1. Start PostgreSQL
You need a running PostgreSQL instance. Using Docker just for the DB:
```bash
docker run -d \
  --name lingap-db \
  -e POSTGRES_USER=lingap \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=lingap \
  -p 5432:5432 \
  postgres:16-alpine
```

#### 2. Run the Backend
```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Copy and configure env
cp .env.example .env
# Edit .env with your values

# Run the development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be live at: http://localhost:8000

#### 3. Run the Frontend
```bash
cd frontend

# Install dependencies
npm install

# Create env file
cp ../.env.example .env.local
# Edit .env.local — only the NEXT_PUBLIC_ variables are needed here

# Run the dev server
npm run dev
```

Frontend will be live at: http://localhost:3000

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+asyncpg://lingap:password@localhost:5432/lingap` |
| `SECRET_KEY` | JWT signing key (change in prod!) | `my-secret-key` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | JWT token lifespan | `1440` |
| `STELLAR_NETWORK` | `testnet` or `mainnet` | `testnet` |
| `STELLAR_HORIZON_URL` | Stellar Horizon node URL | `https://horizon-testnet.stellar.org` |
| `STELLAR_SOURCE_SECRET_KEY` | Your Stellar account secret key | `SXXX...` |
| `CONTRACT_DONATION_VAULT` | Deployed Donation Vault contract ID | `CDZTFM2B...` |
| `CONTRACT_AID_PROVENANCE` | Deployed Aid Provenance contract ID | `CXXX...` |
| `CONTRACT_BENEFICIARY_REGISTRY` | Deployed Beneficiary Registry contract ID | `CXXX...` |
| `CORS_ORIGINS` | Comma-separated allowed frontend origins | `http://localhost:3000` |

### Frontend (`.env.local`)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | URL of the backend API |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` or `mainnet` |
| `NEXT_PUBLIC_CONTRACT_DONATION_VAULT` | Contract address for frontend use |
| `NEXT_PUBLIC_CONTRACT_AID_PROVENANCE` | Contract address for frontend use |
| `NEXT_PUBLIC_CONTRACT_BENEFICIARY_REGISTRY` | Contract address for frontend use |

---

## API Endpoints Summary

All routes are prefixed with `/api/v1`.

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/login` | Login, returns JWT token |
| `GET` | `/dashboard` | Summary stats |
| `GET/POST` | `/donations` | List / create donations |
| `GET/POST` | `/beneficiaries` | List / register beneficiaries |
| `GET/POST` | `/aid-requests` | List / submit aid requests |
| `PATCH` | `/aid-requests/{id}/approve` | Approve an aid request |
| `GET` | `/stellar/...` | Soroban contract queries |
| `GET` | `/health` | Health check |

Full interactive API docs available at: http://localhost:8000/docs

---

## Smart Contracts — Build & Deploy (Advanced)

Only needed if you're modifying or redeploying the Rust contracts.

**Requirements:**
- [Rust](https://www.rust-lang.org/tools/install)
- [Soroban CLI](https://soroban.stellar.org/docs/getting-started/setup)

```bash
cd contracts

# Build all contracts
cargo build --target wasm32-unknown-unknown --release

# Deploy a contract (example: donation_vault)
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/donation_vault.wasm \
  --source <YOUR_SECRET_KEY> \
  --network testnet
```

After deploying, update the contract addresses in your `.env` files.

---

## Common Issues

| Problem | Solution |
|---|---|
| `connection refused` on port 5432 | Make sure Docker is running and the `postgres` container is healthy |
| `STELLAR_SOURCE_SECRET_KEY` missing | Add your testnet Stellar secret key to `backend/.env` |
| Frontend can't reach backend | Check `NEXT_PUBLIC_API_URL` is set to `http://localhost:8000` |
| Database tables missing | The backend auto-creates tables on startup via `init_db()` |
| Docker build fails | Run `docker-compose down -v` then `docker-compose up --build` again |
