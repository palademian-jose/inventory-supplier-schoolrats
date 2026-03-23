# Inventory and Supplier Management System

Academic inventory and supplier management prototype built with React, Tailwind CSS, Node.js, Express, and MySQL.

## Overview

This project includes:

- A React frontend for dashboard, inventory, supplier, purchasing, payment, and issue workflows
- An Express backend with JWT authentication and REST endpoints
- A MySQL schema with seeded sample data and demo user accounts
- A Podman compose stack for running the full system with one command

## Features

- JWT-based login
- Dashboard summary and recent stock transactions
- Recipient, supplier, and item management
- Supplier catalog management with supplier price and lead time
- Purchase orders and payment tracking
- Stock transaction history
- Stock issue workflow with recipient tracking and stock deduction

## Project Structure

```text
inventory-supplier-system/
├── backend/
│   ├── src/
│   ├── .env.example
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   └── package.json
├── database/
│   └── schema.sql
├── podman-compose.yml
├── package.json
└── README.md
```

## Requirements

For the recommended setup:

- Node.js 18+ or 20+
- npm
- Podman
- `podman-compose` or Podman's compose provider

For manual local setup without containers:

- Node.js 18+ or 20+
- npm
- MySQL 8+

## Default Ports

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000/api`
- MySQL host port: `3307`

## Demo Accounts

The seeded database includes these accounts:

- `admin / password123`
- `staff / password123`

## Recommended Setup: Podman or Docker

This is the fastest way to run the whole project. The npm stack commands prefer Podman and fall back to Docker Compose automatically.

### 1. Clone the project

```bash
git clone <your-repository-url>
cd inventory-supplier-system
```

### 2. Start the full stack

```bash
npm run up
```

This command builds and starts:

- MySQL
- Backend API
- Frontend container

### 3. Open the app

Frontend:

```text
http://localhost:8080
```

Backend health check:

```text
http://localhost:5000/api/health
```

### 4. Sign in

Use one of the seeded accounts, for example:

```text
Username: admin
Password: password123
```

## Container Commands

Start the stack:

```bash
npm run up
```

This tries, in order:

- `podman-compose`
- `podman compose`
- `docker compose`

The compose file is shared across both runtimes.

Stop the stack:

```bash
npm run down
```

View logs:

```bash
npm run logs
```

Restart the full stack:

```bash
npm run stack:restart
```

Reset containers and database data:

```bash
npm run reset
```

Important:

- `npm run reset` deletes the MySQL volume and reloads data from [schema.sql](/home/deimos/Projects/inventory-supplier-system/database/schema.sql)
- Use it only if you want a fresh seeded database

## How Database Initialization Works

The MySQL service is built from [database/Dockerfile](/home/deimos/Projects/inventory-supplier-system/database/Dockerfile), which copies [schema.sql](/home/deimos/Projects/inventory-supplier-system/database/schema.sql) into MySQL's init directory:

- `/docker-entrypoint-initdb.d/01-schema.sql`

That script creates the tables and inserts the initial sample data. This avoids Podman SELinux bind-mount issues while staying portable across Podman and Docker.

If the MySQL volume already exists, MySQL will not re-import the schema automatically. Use:

```bash
npm run reset
```

if you need to rebuild the database from scratch.

## Manual Local Setup

Use this path if you do not want to use Podman.

### 1. Create the MySQL database

Create a database named:

```text
inventory_supplier_system
```

Then import the schema:

```bash
mysql -u root -p inventory_supplier_system < database/schema.sql
```

### 2. Configure the backend

Go to the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create a `.env` file based on [.env.example](/home/deimos/Projects/inventory-supplier-system/backend/.env.example).

Example local backend `.env`:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=inventory_supplier_system
JWT_SECRET=change-this-secret
```

Start the backend:

```bash
npm run dev
```

The backend will run at:

```text
http://localhost:5000
```

### 3. Configure the frontend

Open a new terminal and go to the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

If your backend is running at the default address, no frontend env file is required because the app already falls back to:

```text
http://localhost:5000/api
```

If your backend runs somewhere else, create `frontend/.env` and set:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Vite will print the local development URL in the terminal, typically:

```text
http://localhost:5173
```

## Environment Variables

### Backend

Defined in [.env.example](/home/deimos/Projects/inventory-supplier-system/backend/.env.example):

- `PORT`: backend server port
- `DB_HOST`: MySQL host
- `DB_PORT`: MySQL port
- `DB_USER`: MySQL username
- `DB_PASSWORD`: MySQL password
- `DB_NAME`: database name
- `JWT_SECRET`: secret used to sign login tokens

### Frontend

- `VITE_API_URL`: API base URL used by the frontend

Default fallback in the frontend:

```text
http://localhost:5000/api
```

## API Check

After startup, verify the backend is reachable:

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{"message":"Inventory Supplier Management API is running"}
```

## Troubleshooting

### White screen or "Dashboard unavailable"

Usually means one of these:

- the backend is not running
- the frontend cannot reach `http://localhost:5000/api`
- the browser has stale login data

Try:

```bash
npm run logs
```

Then reload the app and sign in again.

### Backend returns 401 on dashboard

This usually happens when the browser has an old or invalid token in local storage. Reload the page and log in again.

### Port already in use

If `8080`, `5000`, or `3307` is already occupied on your machine, stop the conflicting process or change the port mapping in [podman-compose.yml](/home/deimos/Projects/inventory-supplier-system/podman-compose.yml).

### Database changes are not appearing

If you changed [schema.sql](/home/deimos/Projects/inventory-supplier-system/database/schema.sql) after the MySQL volume was already created, the container will not automatically re-import it. Run:

```bash
npm run reset
```

## Build Notes

Frontend production build:

```bash
cd frontend
npm run build
```

Backend production start:

```bash
cd backend
npm start
```

## Tech Stack

- React
- Vite
- Tailwind CSS
- Node.js
- Express
- MySQL
- Podman
