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
docker compose -f docker-compose.dev.yml up --build
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
DB_HOST=db
DB_USER=root
DB_PASSWORD=brightbuy
DB_NAME=BrightBuy
DB_DIALECT=mysql
DB_PORT=3306
JWT_SECRET=FrenchFriesSecretSauceWithExtraSalt12345
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
AWS_ACCESS_KEY_ID=AKIAYB7IDXKIXUR2IZHB
AWS_SECRET_ACCESS_KEY=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
AWS_REGION=ap-south-1
S3_BUCKET_NAME=brightbuy
APP_PORT=8081
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



# API Usage

// 1. Create New Attribute
POST /api/attribute
Content-Type: application/json

{
  "name": "RAM"
}

// 2. Create New Category
POST /api/category
Content-Type: application/json

{
  "name": "Projectors",
  "attributes": [3],
  "parentId": [5]
}

// 3. Add Attributes to Existing Category
PATCH /api/category/addAttributes/11
Content-Type: application/json

{
  "attributeIds": [1, 2]
}

// 4. Create Product
POST /api/product
Content-Type: application/json

{
  "name": "Epson Home Cinema Projector",
  "description": "Full HD 1080p home cinema projector, perfect for movies and presentations.",
  "brand": "Epson",
  "categoryIds": [5],
  "attributes": [{"id":3,"value":"1920x1080"}],
  "stockQnt": 50,
  "price": 749.99
}

// 5. Create Product Variant
POST /api/variant
Content-Type: application/json

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

// 6. Update Variant Stock
PATCH /api/variant/stock/:variantId
Content-Type: application/json

{
  "qnt": 4
}

// 7. Assign Staff to Delivery
PATCH /api/delivery/:deliveryId/assignStaff
Content-Type: application/json

{
  "staffId": 4
}

// 8. Place Order
POST /api/order
Content-Type: application/json
Authorization: Bearer <token>

{
  "items": [
    {"variantId": "2", "quantity": 200, "isBackOrdered": true},
    {"variantId": "10", "quantity": 20, "isBackOrdered": false}
  ],
  "paymentMethod": "Card",
  "deliveryMode": "Standard Delivery",
  "deliveryAddress": {
    "address": "1, Galle Rd, Colombo",
    "city": "Colombo"
  }
}

// 9. Update Order Status
PATCH /api/order/update/:orderId
Content-Type: application/json

{
  "status": "Shipped"
}

// 10. Record COD Payment
PATCH /api/payment/codPayment/:paymentId
Content-Type: application/json

{
  "amount": 12454
}
