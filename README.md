# 🛡️ Relief Shield

**Real-Time Disaster Relief Coordination Platform**

Relief Shield connects disaster victims with nearby volunteers, NGOs, and emergency responders through location-based matching, role-based workflows, and real-time status tracking.

---

## 🏗️ Tech Stack & Technical Rationale

Each technology in the stack was deliberately chosen for disaster relief coordination:

- **Frontend:** `React.js` + `React Router`
  - *Why:* Provides a reactive, responsive Single-Page Application (SPA) with declarative client-side route protection by role (`Victim`, `Volunteer`, `NGO`, `Admin`), eliminating full-page reloads during high-stress operations.
- **Backend:** `Node.js` + `Express.js`
  - *Why:* High-concurrency, asynchronous event loop ideal for handling simultaneous real-time Socket.IO events and high-traffic RESTful incident reports.
- **Database:** `MongoDB` with `Mongoose` (`2dsphere` geospatial index)
  - *Why:* Natural disasters damage infrastructure and make street addresses unreliable. MongoDB's native `2dsphere` index calculates real-world spherical geometry and proximity distances across the Earth's surface for fast geospatial coordinate queries (`[longitude, latitude]`).
- **Real-Time Layer:** `Socket.IO`
  - *Why:* Broadcasts newly created and claimed requests to connected responders instantly with sub-second latency, avoiding battery-draining and bandwidth-heavy HTTP polling.
- **Location Services:** `Google Maps API` (via `.env` key with coordinate fallback)
  - *Why:* Renders interactive maps, reverse geocodes locations, and displays incident pins.
- **Authentication:** `JWT` (JSON Web Tokens) + `bcryptjs`
  - *Why:* Passwords are one-way salted and hashed. JWTs provide stateless role-based authentication (`req.user.role`) across HTTP and WebSocket handshakes.
- **Image Storage:** `Cloudinary` (via `.env` credentials with local fallback)
  - *Why:* Offloads heavy photo storage (damage assessment, medical evidence) to an optimized cloud CDN, preventing database bloat.

---

## 📁 Project Architecture

```
busy-goodall/
├── package.json               # Monorepo scripts (run server and client)
├── README.md                  # Complete documentation and setup guide
├── .gitignore
├── server/
│   ├── package.json           # Express, Mongoose, Socket.IO, JWT, bcrypt, Multer, Cloudinary
│   ├── .env.example           # Server environment template
│   ├── .env                   # Local configuration
│   └── src/
│       ├── server.js          # Express entrypoint + Socket.IO setup
│       ├── config/            # DB connection & Cloudinary setup
│       ├── models/            # User, EmergencyRequest (2dsphere index), Donation
│       ├── middleware/        # JWT auth, role authorization, Multer
│       ├── controllers/       # Auth controller, EmergencyRequest controller
│       ├── routes/            # /api/auth, /api/requests
│       └── utils/seed.js      # Automatic database seeder
└── client/
    ├── package.json           # React, React Router, Socket.IO client
    ├── vite.config.js
    ├── index.html
    ├── .env.example           # Client environment template
    ├── .env                   # Local client configuration
    └── src/
        ├── main.jsx
        ├── App.jsx            # React Router route definitions
        ├── index.css          # Plain, functional CSS styling
        ├── context/           # AuthContext (JWT management & session state)
        ├── components/        # Navbar, StatusBadge, LocationPicker, ProtectedRoute
        └── pages/             # Login, Register, CreateRequest, Feed, MyRequests, RequestDetails
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** running locally on port 27017 or a **MongoDB Atlas URI**

### 2. Environment Configuration

Check and configure the `.env` files in both directories:

**Server (`server/.env`):**
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/relief_shield
JWT_SECRET=relief_shield_super_secure_jwt_secret_dev_key_2026
CLIENT_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=placeholder_cloud_name
CLOUDINARY_API_KEY=placeholder_api_key
CLOUDINARY_API_SECRET=placeholder_api_secret
GOOGLE_MAPS_API_KEY=placeholder_google_maps_api_key
```

**Client (`client/.env`):**
```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_MAPS_API_KEY=placeholder_google_maps_api_key
```

### 3. Install Dependencies

From the project root:
```bash
# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

### 4. Database Seeding

The server automatically checks and seeds the database upon first startup. To manually re-seed:
```bash
cd server
npm run seed
```

#### Pre-configured Test Accounts:
All test accounts share the password: **`password123`**

| Role | Email | Capabilities |
| :--- | :--- | :--- |
| **Victim** | `victim@example.com` | Create emergency requests, view real-time status tracking |
| **Volunteer** | `volunteer@example.com` | Browse request feed, claim pending emergencies, advance status |
| **NGO** | `ngo@example.com` | Browse request feed, claim and coordinate relief |
| **Donor** | `donor@example.com` | View relief operations, donate to pools/requests |
| **Admin** | `admin@example.com` | Verify, inspect, and manage all requests |

### 5. Running the Application

In **Terminal 1** (Start Backend):
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

In **Terminal 2** (Start Frontend):
```bash
cd client
npm run dev
# Client runs on http://localhost:5173
```

---

## 🧪 Testing the Core Loop (Phase 2 Demo Walkthrough)

To verify the end-to-end loop (`Signup → Post Request → Claim → Status Update`):

1. **Session 1 (Victim):**
   - Open `http://localhost:5173` in a standard browser window.
   - Click the quick login button for **👤 Victim** (or login with `victim@example.com` / `password123`).
   - Navigate to **🚨 New Emergency Request**.
   - Select **Medical** emergency, **Critical** urgency, enter a description, pick coordinates (e.g. Zone A), and click **Broadcast Emergency Request**.
   - You are redirected to **My Requests**, where the request appears with status **PENDING**.

2. **Session 2 (Volunteer):**
   - Open `http://localhost:5173` in an **Incognito / Private Window** (or a second browser).
   - Click the quick login button for **🤝 Volunteer** (or login with `volunteer@example.com` / `password123`).
   - Open **📡 Request Feed**.
   - Observe the newly created Medical emergency in the list.
   - Click **✋ Claim Request**. The button updates immediately to **Claimed by You**.

3. **Status Progression & Real-Time Sync:**
   - In Session 2 (Volunteer), go to **My Claimed Requests**. Click **🚚 Mark In Progress**.
   - Switch to Session 1 (Victim): Refresh or observe the live card update from **PENDING** to **IN PROGRESS**, now displaying the responder's contact details.
   - In Session 2 (Volunteer), click **✅ Mark Resolved**.
   - The status updates across both sessions to **RESOLVED**.
