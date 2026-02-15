# Payday Source Code

This directory contains the source code for the Payday microservices and frontend application.

## Components

### 1. Auth Service (`auth-service`)
- **Purpose**: Handles user authentication, registration, and JWT token issuing.
- **Tech Stack**: Node.js, Express, PostgreSQL.
- **Key Features**:
  - User Registration
  - Login/Authentication
  - Token Verification

### 2. Payment Service (`payment-service`)
- **Purpose**: Manages user accounts, balances, and financial transactions.
- **Tech Stack**: Node.js, Express, PostgreSQL.
- **Key Features**:
  - Account Creation
  - Deposits & Withdrawals
  - Transfers between users
  - Transaction History
  - Balance Checking

### 3. Dashboard (`dashboard`)
- **Purpose**: User interface for interacting with the Payday system.
- **Tech Stack**: React, Vite, TypeScript.
- **Key Features**:
  - Login/Register Forms
  - Dashboard View (Balance, Transactions)
  - Deposit/Withdraw/Transfer Actions

## Getting Started

1.  **Start Infrastructure**: Run `docker-compose up -d` from the `source_code` directory to start the PostgreSQL database.
    - This will automatically create the `payday_auth` and `payday_payment` databases.
2.  **Environment Variables**: Ensure `.env` files exist in `auth-service` and `payment-service`.
    - `DATABASE_URL` should point to the database (e.g., `postgresql://postgres:postgres@127.0.0.1:5432/payday_auth`).
3.  **Install Dependencies**: Run `npm install` in each directory: `auth-service`, `payment-service`, and `dashboard`.
4.  **Run Services**: Opening a terminal for each:
    - `auth-service`: `npm run dev` (Port 4001)
    - `payment-service`: `npm run dev` (Port 4002)
    - `dashboard`: `npm run dev` (Port 5173)

## API Documentation
Swagger documentation is available at `/api-docs` for both backend services when running.
