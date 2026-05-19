# LINGAP
Ledger-Integrated Network for Giving, Accountability, and Protection

---

## Quick Setup

### Requirements
- Docker Desktop installed and running
- https://www.docker.com/products/docker-desktop/

---

### Step 1 - Create the .env file

The backend/.env file is not included in the repo (gitignored for security).
You need to create it manually before running docker-compose.

Mac/Linux:
cp backend/.env.example backend/.env

Windows:
copy backend\.env.example backend\.env

---

### Step 2 - Run Docker

cd LINGAP-main
docker-compose up --build

First build takes 3-5 minutes.

---

### Step 3 - Open in browser

Frontend:  http://localhost:3000
Backend:   http://localhost:8000
API Docs:  http://localhost:8000/docs

---

## Common Errors

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
- Open Docker Desktop app first
- Wait for it to fully load (whale icon in taskbar)
- Then run docker-compose up --build again

---

## Deployed Contracts (Stellar Testnet)

Donation Vault: CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP

Explorer: https://stellar.expert/explorer/testnet/contract/CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP