# 🛡️ BELVEDERE — Batheja Garments Luxury E-Commerce Platform

> A full-stack luxury fashion & e-commerce application featuring Role-Based Access Control (RBAC), real-time interactive canvas styling, AI outfit recommendations, multi-gateway payments, and custom white-glove order tracking.

---

## ✨ Key Features & Architecture Highlights

* 🔐 **Role-Based Access Control (RBAC) System:** Strict separation of duties between regular users and system administrators (`role: 'user'` | `'admin'`). Secured endpoints with JWT & custom authorization middleware.
* 🛠️ **Atelier HQ (Admin Control Center):** Real-time consumer search analytics, interactive stock integrity monitor, inventory updates, and order fulfillment tracking.
* 🛍️ **Interactive Lookbook Studio:** Interactive drag-and-drop canvas studio allowing users to compose, scale, and save personalized outfits to MongoDB.
* ✨ **Resident AI Stylist Engine:** Rule-based AI fashion recommendations tailored to client demographics, age, and profile preferences.
* 💳 **Multi-Channel Payment System:** Supports Razorpay integration, Luhn-algorithm validated credit/debit processing, real-time UPI simulation with NPCI connection modal, and COD.
* 💬 **Concierge Help Centre & Direct Support:** Interactive live concierge chat widget and automated direct email ticket generation with SLA tracking (`BAT-XXXXX`).
* 🎨 **Interactive Product Cards:** Smooth floating elevation pop-up animations (`translateY(-12px) scale(1.02)`) with cursor coordinate tracking and high-definition magnifying lens.

---

## 🛠️ Technology Stack

| Tier | Technologies |
| :--- | :--- |
| **Frontend** | React 18, React Router v6, CSS3 Animations, Responsive Design System |
| **Backend** | Node.js, Express.js, JSON Web Tokens (JWT), Bcrypt, Multer CDN Uploads |
| **Database** | MongoDB Atlas Cloud, Mongoose ORM |
| **Security** | Express Role Middleware, CORS Protection, Input Validation |
| **Payments & Tools** | Razorpay SDK, NPCI UPI Simulator, Nodemailer |

---

## ⚡ Quick Start (Local Setup)

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/YOUR_USERNAME/Batheja_garments.git
cd Batheja_garments

# Install Backend & Frontend
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment Variables
Create `.env` inside `backend/`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Run Application
```bash
# Terminal 1: Run Backend
cd backend && node server.js

# Terminal 2: Run Frontend
cd frontend && npm start
```
* **Frontend App:** `http://localhost:3000`
* **Backend Server:** `http://localhost:5000`
* **Default Admin Account:** `admin@batheja.com` / `admin123`

---

## 📝 License
Distributed under the MIT License. Developed by **Yugam Batheja**.
