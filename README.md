# LINGAP
### Ledger for Integrity, Need-based Giving, Aid Provenance, and Protection

> A Filipino-first transparent donation platform that uses Soroban smart contracts to turn online donation drives into verified, milestone-based aid campaigns.

---

## 🧩 Problem

During crises, transparency in how donations are distributed is often lacking, leading to mistrust. Aid distribution can be slow, inefficient, and susceptible to fraud. Donors want absolute assurance that their funds directly reach the intended beneficiaries.

Existing platforms treat the transaction endpoint as the moment funds hit the campaign creator's account — after that, the money enters a black box. Scammers exploit this exact gap: building compelling narratives, collecting funds, withdrawing, and vanishing. The core issue is **post-donation accountability**.

> **Data point:** GoFundMe created 1.4 million unauthorized charity pages, siphoning search traffic and applying a default 14–16.5% tip that stayed with the platform rather than reaching actual charities.
> — Coalition of 20+ state Attorneys General, March 2026 · [CBS News](https://www.cbsnews.com/detroit/news/michigan-among-over-20-states-insisting-gofundme-remove-unauthorized-charity-pages/) · [Momentive Software](https://momentivesoftware.com/blog/gofundme-nonprofit-scandal/)

---

## 🌟 Vision

To create a fully transparent, blockchain-powered ecosystem where every peso donated is tracked, verified, and efficiently disbursed to verified beneficiaries — restoring absolute trust in charitable giving.

---

## 🎯 Purpose

LINGAP bridges the gap between donors and verifiable causes. By leveraging blockchain technology, aid operations become immutable, auditable, and transparent, protecting both the donors and the beneficiaries.

If your platform simply records that a donation happened, it is just a public ledger — it does not prevent scams. What is missing is **control over fund utilization**. LINGAP solves this by replacing the organizer as the custodian of funds with a self-executing smart contract on the Stellar blockchain. Donated funds never touch the organizer's wallet. Instead, they are held in a programmable escrow that can only release money to pre-verified institutional wallets (hospitals, pharmacies, schools) and only after conditions defined at campaign creation are satisfied.

A donor is no longer paying a person. **A donor is paying a contract.** And unlike a person, a contract cannot lie, cannot disappear, and cannot be bribed.

---

## 👥 Target Users

- **Donors** — Individuals and organizations looking for transparent, verified campaigns to support without fear of fraud.
- **Beneficiaries** — Filipinos in need of medical, educational, or disaster relief assistance.
- **Aid Organizations / NGOs** — Groups needing a reliable, transparent platform to manage campaigns and disburse funds securely.

---

## ✨ Features

### Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Milestone-Based Escrow** | Locks donations in a smart contract and releases funds only when campaign milestones are verified. |
| 2 | **Proof of Reality & Progress** | Requires receipts, documents, verifier confirmations, and progress updates to prove that the campaign is real and actively moving. |
| 3 | **Donor Voting & Clawback Protection** | Allows donors to pause suspicious or stalled campaigns and refund remaining unspent funds if fraud or misuse is proven. |
| 4 | **On-Chain Donation Proof & Impact Certificates** | Provides donors with verifiable donation records and shareable certificates showing their contribution and supported milestones. |
| 5 | **AI-Assisted Spending & Risk Audit** | Compares requested vs. actual spending, detects suspicious campaign patterns, and flags potential scams for review. |

### Additional Features

- Donor leaderboard — recognition wall, top contributors recognized publicly
- Campaign sharing buttons (Facebook, TikTok, Messenger)
- "Near Me" campaigns using GPS
- Organizer credibility scoring
- Streak rewards for consecutive monthly donors
- Personal impact dashboard (total donated, campaigns helped, lives impacted estimate)
- Volunteer matching — connect donors who want to give time, not money

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js (React), Tailwind CSS, TanStack Query |
| **Backend** | Python, FastAPI, PostgreSQL |
| **Blockchain** | Stellar (Soroban / Horizon API / Stellar SDK) |
| **DevOps** | Docker, Docker Compose |

---

## 🚀 How to Run Locally

```bash
git clone https://github.com/wolfsenberg/LINGAP.git
cd LINGAP
docker-compose up --build
```

---

## 🌐 Deployment

### Testnet
- **Contract / App Address:** `CDZTFM2BHBLYQLIJSSF7UOSWCQMQMOUATXEJTDOHKBIZ6R4DFZKB7DDP`
- 📸 Screenshot — Stellar Expert (Testnet)

  ![Testnet Screenshot](./screenshots/testnet.png)

### Mainnet
- **Contract / App Address:** `GXXXX...`
- 📸 Screenshot — Stellar Expert (Mainnet)

  ![Mainnet Screenshot](./screenshots/mainnet.png)

---

## 🎥 Demo

- 🔗 **Live App:** [[link](https://lingap-ledger.vercel.app/)]
- 🎬 **Demo Video:** [YouTube / Loom link]
- 🖼️ **Pitch Deck:** [[Canva link](https://www.canva.com/design/DAHKOM-6DPY/InVZSRGdgDInMo4TDtR4Hw/edit)]

---

## 👨‍💻 Team

| Name | Role | GitHub |
|------|------|--------|
| Jimuelle Patron | Backend Developer | [@Jimuelle07](https://github.com/Jimuelle07) |
| Alexander Nevero | Backend Developer | [@Alexandre-Nevero](https://github.com/Alexandre-Nevero) |
| Melfred Bernabe | Backend Developer | [@caramel-123](https://github.com/caramel-123) |
| Geinel Niño Dungao | Full-Stack Developer | [@wolfsenberg](https://github.com/wolfsenberg) |
| Helena Herero | Graphics Designer | [@Helene-Herero](https://github.com/Helene-Herero) |

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).
