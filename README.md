# KURALO BOOK
> **Shop Smart. Speak Your Price.**

India's first AI-powered multilingual voice and text bargaining e-commerce platform connecting conscious shoppers directly with verified local sellers.

---

## 🌟 Key Features

1. **AI Voice & Text Bargaining (Flagship)**:
   - Negotiate product prices live with an AI assistant in **Tamil (தமிழ்)**, **Hindi (हिंदी)**, and **English**.
   - Natural speech recognition via browser Web Speech API with text fallback.
   - Speech synthesis for natural spoken counteroffers.
   - Interactive waveform audio visualizers for speaking and listening states.
2. **Confidential Seller Price Security (Strict Server-Side)**:
   - Minimum acceptable price and profit floor are strictly confidential.
   - Client and frontend LLM are never exposed to seller rules.
   - Server-side algorithm strictly validates and bounds every counteroffer.
   - Negotiation rounds are capped (maximum 3 rounds).
3. **E-Commerce Experience**:
   - Modern product catalog with instant search, category filters, and sorting.
   - Dynamic Shopping Cart with persistent storage and savings breakdown.
   - Progressive 4-step Checkout (Address, Delivery Speed, Razorpay test mode payment, Order Confirmation).
   - Saved Wishlist and Order History tracking.
4. **Resilient Architecture**:
   - Seamless dual-mode: Works out-of-the-box with **Supabase PostgreSQL & Auth**, or gracefully switches to high-fidelity in-memory demo data with zero configuration needed.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router v6, Lucide Icons, React Hot Toast.
- **Backend**: Python 3.10+, FastAPI, Pydantic v2, Uvicorn, REST APIs.
- **Database & Auth**: Supabase (PostgreSQL 15+, Row Level Security, JWT Authentication).
- **Payment Gateway**: Razorpay (Test mode integration with cryptographic HMAC verification).
- **Speech & AI**: Web Speech Recognition & Synthesis, OpenAI GPT / Multilingual Response Engine.

---

## 🚀 Quick Start Guide

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env

# Run FastAPI server
uvicorn main:app --reload --port 8000
```
FastAPI interactive Swagger documentation will be available at `http://localhost:8000/docs`.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
The application will be live at `http://localhost:5173`.

---

## 🗄️ Database Migrations (Supabase)

Run the SQL migration scripts in `database/` in the Supabase SQL Editor in this order:
1. `database/schema.sql` — Tables, indexes, triggers
2. `database/rls_policies.sql` — Row Level Security policies
3. `database/functions.sql` — PostgreSQL utility functions
4. `database/seed_data.sql` — Seed products, categories, sellers, and pricing rules
