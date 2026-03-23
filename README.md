# Inventory and Supplier Management System

Simple academic prototype built with React, Tailwind CSS, Node.js, Express, and MySQL.

## Folder Structure

```text
inventory-supplier-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── config/
│   │   ├── context/
│   │   ├── layout/
│   │   ├── pages/
│   │   └── styles/
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── database/
    └── schema.sql
```

## Features

- Authentication with JWT and role-based route protection
- Dashboard summary cards and recent stock activity
- CRUD for members, suppliers, and items
- Supplier-item mapping with supplier price and lead time
- Purchase orders with multiple items and auto-total
- Payments tracking and payment status display
- Stock transactions with filters
- Issue items to members with automatic stock deduction
- Search, pagination, modal forms, toasts, loading states, and delete confirmation

## Setup

### 1. Database

Run the SQL file in MySQL:

```sql
SOURCE /path/to/inventory-supplier-system/database/schema.sql;
```

Demo users:

- `admin / password123`
- `staff / password123`
- `member / password123`

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Set `VITE_API_URL` in a frontend `.env` file if the backend is not running on `http://localhost:5000/api`.

## One Command Stack With Podman

This repo now includes [podman-compose.yml](/home/deimos/Projects/inventory-supplier-system/podman-compose.yml) plus root npm scripts.

Prerequisite:

- Install `podman-compose` or a Podman Docker Compose provider on your machine

Run the full stack:

```bash
cd /home/deimos/Projects/inventory-supplier-system
npm run up
```

This starts:

- MySQL on `127.0.0.1:3307`
- Express backend on `http://localhost:5000`
- Frontend on `http://localhost:8080`

Useful commands:

```bash
npm run logs
npm run down
npm run stack:restart
npm run reset
```

Notes:

- The schema is auto-imported on the first MySQL container startup from `./database/schema.sql`
- `npm run reset` removes the compose stack, deletes the MySQL volume, and starts the stack again
- Running `npm run reset` deletes all current database data and reloads the predefined seed data from `./database/schema.sql`
