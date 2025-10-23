# BrightBuy

BrightBuy is a full-stack retail inventory and online order management system. It includes a **Node.js backend**, **React + Vite frontend**, and **MySQL database** running via **Docker Compose**.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Setup & Running](#setup--running)
- [Environment Variables](#environment-variables)
- [Docker Commands](#docker-commands)
- [Logging](#logging)
- [Database Seeding](#database-seeding)

---

## Features

- User authentication with JWT
- Stripe payment integration
- Product catalog with categories, variants, and attributes
- Inventory management
- Order management
- File storage using AWS S3
- Dockerized development and production setup

---

## Tech Stack

- **Backend:** Node.js, Express, Sequelize ORM, MySQL
- **Frontend:** React, Vite, Tailwind CSS
- **Database:** MySQL 8
- **Payment:** Stripe API
- **Storage:** AWS S3
- **Containerization:** Docker & Docker Compose

---

## Prerequisites

- Docker >= 24
- Docker Compose plugin
- Node.js >= 20 (for local dev)
- npm >= 9 (for local dev)

---

## Project Structure

```
BrightBuy/
│
├─ backend/               # Node.js backend
│  ├─ server.js
│  ├─ package.json
│  ├─ .env
│  └─ ...
│
├─ frontend/              # React frontend
│  ├─ package.json
│  ├─ vite.config.ts
│  └─ ...
│
├─ seed.sql               # Initial database seed
├─ docker-compose.dev.yml # Development docker compose file
├─ docker-compose.prod.yml# Production docker compose file
└─ README.md
```

---

## Setup & Running

### 1. Clone the repo

```bash
git clone <your-repo-url>
cd BrightBuy
```

### 2. Development with Docker Compose

```bash
s
```

- Backend runs on: `http://localhost:8081`
- Frontend runs on: `http://localhost:5173`
- MySQL database: `BrightBuy`

### 3. Access MySQL container

```bash
docker compose -f docker-compose.dev.yml exec db mysql -u root -p BrightBuy
```

---

## Environment Variables

**Backend `.env` example:**

```env
# --- Database ---
DB_HOST=db
DB_USER=root
DB_PASSWORD=brightbuy
DB_NAME=BrightBuy
DB_DIALECT=mysql
DB_PORT=3306

# --- App ---
APP_PORT=8081

# --- Auth ---
# Generate a long random string
JWT_SECRET=replace-with-long-random-secret

# --- Stripe ---
STRIPE_SECRET_KEY=sk_test_replace
STRIPE_WEBHOOK_SECRET=whsec_replace

# --- AWS S3 (for image uploads) ---
AWS_ACCESS_KEY_ID=AKIA_REPLACE
AWS_SECRET_ACCESS_KEY=REPLACE_ME
AWS_REGION=ap-south-1
S3_BUCKET_NAME=brightbuy
```

---

## Docker Commands

- **Build & start containers:**

```bash
docker compose -f docker-compose.dev.yml up --build
```

- **Stop & remove containers, networks, volumes:**

```bash
docker compose -f docker-compose.dev.yml down -v
```

- **View real-time logs (all services):**

```bash
docker compose -f docker-compose.dev.yml logs -f
```

- **View logs for a specific service (backend):**

```bash
docker compose -f docker-compose.dev.yml logs -f backend
```

---

## Deploy / Setup server

If you have a remote server and a private key, you can copy the setup script and run it with the following commands (replace paths/host as needed):

1. Copy the setup script to the server (example uses an AWS-like Ubuntu host):

```bash
scp -i ~/Downloads/bright.pem ~/Downloads/setup_server.sh ubuntu@13.201.36.162:/home/ubuntu/
```

2. SSH into the server:

```bash
ssh -i ~/Downloads/bright.pem ubuntu@13.201.36.162
```

3. Make the script executable and run it (as sudo if necessary):

```bash
chmod +x setup_server.sh
sudo ./setup_server.sh
```
```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker

```
Notes:
- Ensure the private key file (`bright.pem`) has secure permissions (chmod 600).
- Replace the IP address, username, and key path to match your server and credentials.
- Review `setup_server.sh` before running it on a production host to verify what it installs and configures.

---

## Logging

- Backend uses `console.log` for logging actions.
- Use `docker compose logs -f backend` to see real-time logs.
- To detach from a running container while viewing logs: `Ctrl + C`
- For attaching to live container stdout:

```bash
docker attach brightbuy-backend-1
```

Detach without stopping: `Ctrl + P` then `Ctrl + Q`.

---

## Database Seeding

- `seed.sql` runs automatically on first container startup.
- Contains initial categories, products, and sample data.

---

## CI/CD (GitHub Actions)

This repo includes a workflow at `.github/workflows/ci-cd.yml` that:

- Runs backend tests and builds the frontend
- Builds and pushes Docker images for backend and frontend
- Optionally deploys to a remote server via SSH

Required configuration:

- Set `IMAGE_BASE` in the workflow `env:` to your image base, for example `yourdockeruser/brightbuy`.
  - Images will be tagged as `${IMAGE_BASE}-backend` and `${IMAGE_BASE}-frontend`.

- GitHub Actions repository secrets (Settings → Secrets and variables → Actions):
  - `DOCKER_USERNAME` — your Docker Hub username
  - `DOCKER_PASSWORD` — a Docker Hub Personal Access Token (recommended) or password
  - For deploy (optional):
    - `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`

Notes:

- If you prefer GitHub Container Registry (GHCR), update the login step and tags:
  - Use `registry: ghcr.io` and a `GHCR_TOKEN` with `write:packages` scope, and set `IMAGE_BASE=ghcr.io/<owner>/brightbuy`.
  - Example login step:
    - uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}
  - Then tag images as `ghcr.io/<owner>/brightbuy-backend` and `-frontend`.



# API Usage

// 1. Create New Attribute
POST /api/attribute
Content-Type: application/json
```
{
  "name": "RAM"
}
```

// 2. Create New Category
POST /api/category
Content-Type: application/json
```

{
  "name": "Projectors",
  "attributes": [3],
  "parentId": [5]
}
```

// 3. Add Attributes to Existing Category
PATCH /api/category/addAttributes/11
Content-Type: application/json
```

{
  "attributeIds": [1, 2]
}
```

// 4. Create Product
POST /api/product
Content-Type: application/json
```

{
  "name": "Epson Home Cinema Projector",
  "description": "Full HD 1080p home cinema projector, perfect for movies and presentations.",
  "brand": "Epson",
  "categoryIds": [5],
  "attributes": [{"id":3,"value":"1920x1080"}],
  "stockQnt": 50,
  "price": 749.99
}
```

// 5. Create Product Variant
POST /api/variant
Content-Type: application/json
```

{
  "productId": 1,
  "variantName": "Galaxy S25 Ultra Green 128GB",
  "attributes": [
    {"id":1,"value":"Green"},
    {"id":2,"value":"128GB"}
  ],
  "categoryIds": [11],
  "price": 1199.99,
  "stockQnt": 100
}
```

// 6. Update Variant Stock
PATCH /api/variant/stock/:variantId
Content-Type: application/json
```

{
  "qnt": 4
}
```

// 7. Assign Staff to Delivery
PATCH /api/delivery/:deliveryId/assignStaff
Content-Type: application/json
```

{
  "staffId": 4
}
```

// 8. Place Order
POST /api/order
Content-Type: application/json
Authorization: Bearer <token>
```

{
  "items": [
    {"variantId": "2", "quantity": 200, "isBackOrdered": true},
    {"variantId": "10", "quantity": 20, "isBackOrdered": false}
  ],docker compose -f docker-compose.dev.yml up --build

  "paymentMethod": "Card",
  "deliveryMode": "Standard Delivery",
  "deliveryAddress": {
    "address": "1, Galle Rd, Colombo",
    "city": "Colombo"
  }
}
```

// 9. Update Order Status
PATCH /api/order/update/:orderId
Content-Type: application/json
```

{
  "status": "Shipped"
}

// 10. Record COD Payment
PATCH /api/payment/codPayment/:paymentId
Content-Type: application/json

{
  "amount": 12454
}
```

//11. Register a user
POST api/auth/register

```
{
  "name":"anu",
  "email": "anucustomer@example.com",
  "password": "anu",
  "role": "Customer",
  "phone":"0778778694"

}

```

- retuns

```
{
    "message": "User registered successfully"
}
```

12. Login a user
POST api/auth/login
```
{

  "email": "anuadmin@example.com",
  "password": "anu"
  
}
```
- returns
```
{
    "token": <token>,
    "role": "Admin",
    "email": "anuadmin@example.com"
}
```
-
