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

1.  **Database Setup**: Ensure you have a PostgreSQL instance running and create databases for `payday_auth` and `payday_payment` (or use a single DB with different schemas if configured).
2.  **Environment Variables**: Configure `.env` files in `auth-service` and `payment-service` with your database connection strings (`DATABASE_URL`).
3.  **Install Dependencies**: Run `npm install` in each service directory.
4.  **Run Services**:
    - `auth-service`: `npm run dev` (Port 4001)
    - `payment-service`: `npm run dev` (Port 4002)
    - `dashboard`: `npm run dev` (Port 5173)

## API Documentation
Swagger documentation is available at `/api-docs` for both backend services when running.
