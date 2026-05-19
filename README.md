# LINGAP
Ledger-Integrated Network for Giving, Accountability, and Protection

---

## ⚡ Quick Setup (3 steps lang)

### Requirements
- Docker Desktop installed and running
- https://www.docker.com/products/docker-desktop/

---

### Step 1 — Copy the .env file

Go to backend/ folder, copy .env.example to .env
Or create backend/.env manually (see Step 2 below)

---

### Step 2 — Run Docker

cd LINGAP-main
docker-compose up --build

First build: 3-5 minutes lang.

---

### Step 3 — Open sa browser

Frontend:  http://localhost:3000
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs

---

## 🔧 Common Errors

Port already in use:
Mac/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:8000 | xargs kill -9
lsof -ti:5432 | xargs kill -9

Windows:
netstat -ano | findstr :3000
taskkill /PID <PID number> /F

Build fails:
docker-compose down
docker system prune -f
docker-compose up --build

Docker not running:
- Open Docker Desktop app muna
- Hintayin mag-load (whale icon sa taskbar)
- Then ulitin docker-compose up --build

# LINGAP
LINGAP: Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection

stellar.expert/explorer/testnet/contract/CDZTFM2BHBLYQL
CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP
