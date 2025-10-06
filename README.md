# 🛍️ Micro-Commerce App

A full-stack e-commerce application built for the **Kenkeputa Full-Stack Assessment**.  
This project demonstrates real-world system design, authentication, and state management using modern technologies — including **Expo React Native**, **Node.js/Express**, and **Postgres (Supabase)**.

---

## 🚀 Overview

**Micro-Commerce App** is a simple but production-ready e-commerce system that enables users to:

- Browse and paginate through available products  
- Add and manage items in their shopping cart  
- Place mock checkout orders (no payment integration)  
- Authenticate using email and password (with refresh tokens)  
- Allow admins to manage products and monitor orders  

The project uses a **/client** and **/server** folder structure for clear separation of concerns.

---

## ⚙️ Core Features

### 👤 Authentication
- Secure signup and login using JWT tokens  
- Refresh token implementation (`/auth/refresh`) for session persistence  
- Authenticated user route (`/auth/me`)  
- Logout endpoint for token invalidation  

### 🛒 Shopping Cart
- User-based cart system (linked to logged-in accounts)  
- Add, remove, and update items dynamically  
- Automatic total calculation  

### 📦 Product Management
- View all products with **pagination and filtering**  
- Infinite scrolling implemented on the mobile client  
- Admins can create, edit, and delete products  
- Prevents ordering out-of-stock items  

### 🧾 Orders
- Place and view orders  
- Stock deduction upon order creation  
- Admin endpoint for viewing all orders  

### 🧑‍💻 Admin Panel (Built-in)
- Admin-only access to product and user management  
- CRUD operations for products and users  

---

## 🧱 Project Structure

micro-commerce-app/
├── client/         # Expo React Native frontend
│   ├── app/        # Screens, navigation, and UI components
│   ├── assets/     # Images, fonts, icons
│   ├── api/      # Custom React hooks
│   ├── utils/      # Helper functions
│   └── store/     # Data cacheing logic       
│
├── server/         # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── models/
│   │   ├── utils/
│   │   └── app.js
│   ├── mockdata.json
│   ├── .env.example
│   └── package.json
│
└── README.md


---

## 🧩 Tech Stack

**Frontend:**  
- [Expo React Native](https://expo.dev)  
- React Navigation  
- Axios  
- Context API / AsyncStorage  

**Backend:**  
- Node.js + Express  
- PostgreSQL (via Supabase)  
- JWT Authentication  
- bcrypt for password hashing  
- CORS, Helmet, and rate limiting for security  

**Database:**  
- **Supabase** (hosted PostgreSQL) for reliable and scalable data persistence  

---

## ⚙️ Setup Instructions

### 🔧 Prerequisites
- Node.js (v18 or higher)
- pnpm & npm
- Supabase account (for live DB)
- Expo CLI

### 🗂️ Backend Setup
```bash
cd server
pnpm install
cp .env.example .env
# Add your Supabase connection details and JWT secrets
pnpm run seed     # (optional) populate with mock data
pnpm run dev

### 🗂️ Frontend Setup
cd client
npm install
npx expo start

### 🔑 Environment Variables

# Create a .env file in the /server directory based on .env.example.

| Variable               | Description                                             |
| ---------------------- | ------------------------------------------------------- |
| `PORT`                 | The port your Express server runs on (e.g., `4000`)     |
| `SUPABASE_URL`         | Your Supabase project base URL                          |
| `SUPABASE_API_KEY`     | Supabase API key (service or anon)                      |
| `ACCESS_TOKEN_SECRET`  | Secret key for signing JWT access tokens                |
| `REFRESH_TOKEN_SECRET` | Secret key for signing JWT refresh tokens               |
| `CORS_ORIGIN`          | Allowed frontend origin (e.g., `http://localhost:8081`) |
	
### 🧭 API Endpoints
## 🔐 Auth Routes

| Method | Endpoint               | Description                    |
| ------ | ---------------------- | ------------------------------ |
| POST   | `/api/v1/auth/signup`  | Register new user              |
| POST   | `/api/v1/auth/login`   | Authenticate user              |
| POST   | `/api/v1/auth/refresh` | Refresh access token           |
| POST   | `/api/v1/auth/logout`  | Logout user                    |
| GET    | `/api/v1/auth/me`      | Get current authenticated user |

### 🧑‍💼 Admin Routes
| Method | Endpoint                  | Description     |
| ------ | ------------------------- | --------------- |
| GET    | `/api/v1/admin/users`     | Fetch all users |
| DELETE | `/api/v1/admin/users/:id` | Delete user     |
| GET    | `/api/v1/admin/orders`    | View all orders |

### 🛒 Cart Routes
| Method | Endpoint                              | Description       |
| ------ | ------------------------------------- | ----------------- |
| POST   | `/api/v1/carts`                       | Create a new cart |
| GET    | `/api/v1/carts/:cartId`               | Get cart details  |
| POST   | `/api/v1/carts/:cartId/items`         | Add item to cart  |
| PATCH  | `/api/v1/carts/:cartId/items/:itemId` | Update cart item  |
| DELETE | `/api/v1/carts/:cartId/items/:itemId` | Remove cart item  |

### 🧾 Order Routes
| Method | Endpoint             | Description          |
| ------ | -------------------- | -------------------- |
| GET    | `/api/v1/orders`     | List all user orders |
| POST   | `/api/v1/orders`     | Create new order     |
| GET    | `/api/v1/orders/:id` | View specific order  |
| DELETE | `/api/v1/orders/:id` | Cancel order         |

### 📦 Product Routes
| Method | Endpoint                      | Description                               |
| ------ | ----------------------------- | ----------------------------------------- |
| GET    | `/api/v1/products`            | List products (with pagination & filters) |
| GET    | `/api/v1/products/slug/:slug` | Get product by slug                       |
| POST   | `/api/v1/products`            | Create product (admin only)               |
| PUT    | `/api/v1/products/:id`        | Update product                            |
| DELETE | `/api/v1/products/:id`        | Delete product                            |

###🌱 Mock Data & Seeding
- A mockdata.json file is included for demo purposes.
- Run the seed command to populate initial users, products, and carts:

 pnpm run seed

### 🧠 Architecture Overview
flowchart LR
    A[React Native Client (Expo)] -->|HTTPS Requests| B[Express API Server]
    B -->|SQL Queries| C[(Supabase PostgreSQL)]
    B -->|JWT Auth| D[Access & Refresh Tokens]
    A -->|AsyncStorage| D
    D -->|Refresh Flow| B

### Flow Summary:
- The React Native app communicates with the Express backend via RESTful APIs.
- The backend interacts with a hosted Supabase PostgreSQL database for data persistence.
- Authentication uses JWT tokens with refresh logic to maintain secure sessions.
- Admins have protected access to product and order management endpoints.

### 🚧 Known Limitations
- No unit/integration tests yet
- Some UX polish still pending for mobile checkout flow

### 🔮 Future Improvements
- Add Jest tests for backend routes and edge cases
- Role-based access control (RBAC) for fine-grained permissions
- Cloud storage for product images (Supabase Storage or S3)
- Enhanced analytics for admins