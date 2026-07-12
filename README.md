# SupplySync

SupplySync is a production-grade B2B wholesale management platform
built to eliminate manual inventory work for Indian wholesalers.

The core feature is an AI invoice pipeline — upload a supplier PDF
and the system automatically extracts all line items using OCR and
an LLM, matches them against existing inventory, and populates stock
levels automatically. What previously took hours of manual data entry
now takes one click.

## Features

- AI invoice processing pipeline (Tesseract OCR + Gemini LLM)
- 5-layer product matching engine
- Partial order fulfillment with pessimistic locking
- OTP authentication with JWT and Redis refresh tokens
- Custom per-retailer pricing
- Admin dashboard with live inventory stats
- Full audit logging on all inventory changes

## Tech Stack

**Frontend:** React, Vite, TailwindCSS, TanStack Query, React Router

**Backend:** Node.js, Express, Prisma ORM, PostgreSQL, Redis

**AI/OCR:** Tesseract.js, Google Gemini 2.5 Flash, Cloudinary

**Infrastructure:** Docker, Docker Compose

## Local Setup

### Prerequisites

- Node.js 18+
- Docker Desktop

### Installation

1. Clone the repository
   git clone https://github.com/dhrupadkapoor02/supplysync.git
   cd supplysync

2. Install dependencies
   cd backend && npm install
   cd ../frontend && npm install

3. Set up environment variables
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   Fill in your API keys in backend/.env

4. Start the database and Redis
   docker compose up -d

5. Run database migrations
   cd backend && npx prisma migrate dev

6. Start the servers
   cd backend && npm run dev
   cd frontend && npm run dev

7. Open http://localhost:5173

## Architecture

The backend follows a feature-based modular structure with separate
route, controller, and service layers per module. The AI pipeline
runs synchronously within the request cycle with Cloudinary for
file storage, Tesseract for OCR, and Gemini for structured extraction.

Database uses PostgreSQL via Prisma with pessimistic locking for
concurrent inventory operations and full transaction support.
