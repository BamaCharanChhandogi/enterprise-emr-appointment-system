# Enterprise EMR Appointment Management System (MERN Stack)

A production-grade, real-time Appointment Management module designed for an Enterprise Electronic Medical Record (EMR) system. Built with **Node.js, Express, MongoDB/Mongoose, React.js, Tailwind CSS, and Socket.IO**.

---

## 🌟 Key Highlights & Engineering Features

- **Dynamic Slot Generation Engine**: Computes non-overlapping slots on-the-fly based on doctor working hours, multiple shifts/sessions, configurable slot durations (10/15/30 mins), and breaks (e.g. lunch).
- **Concurrency & Double-Booking Prevention**:
  - Enforced via a **MongoDB Partial Unique Index** on `{ doctor: 1, date: 1, slotStartTime: 1 }` where status $\ne$ `'Cancelled'`.
  - Guarantees data consistency under simultaneous concurrent booking attempts.
  - Re-releases cancelled slots automatically for re-booking.
- **Real-Time WebSocket Sync (Socket.IO)**: Connected staff receive instant slot status changes (`Booked`, `Cancelled`, `Arrived`) without manual page refresh.
- **Role-Based Access Control (RBAC)**:
  - **Super Admin**: Manage doctors, receptionists, doctor weekly schedules, shifts, and view system audit logs.
  - **Receptionist**: Search patients (ID, phone, name), book new/existing patients, update appointments, mark patients as arrived.
  - **Doctor**: View only assigned appointments, view patient details, record consultation and clinical summary notes.
- **Robust Security & JWT Dual-Token Lifecycle**: Access tokens (15m) + refresh tokens (7d) with automatic token rotation, bcrypt password hashing, and token revocation on logout.
- **Complete Audit Trail**: Immutable logging of authentications, booking creations, status transitions, and cancellations.
- **Zero-Config In-Memory MongoDB Fallback**: Built-in `mongodb-memory-server` with Replica Set support allows running out of the box with zero external database configuration!

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend** | Node.js (v20+ / v24+), Express.js 4, MongoDB, Mongoose 8 |
| **Frontend** | React 19, Vite, Tailwind CSS v4, Lucide Icons, Axios |
| **Real-time** | WebSockets via Socket.IO 4 |
| **Security** | JWT (jsonwebtoken), bcryptjs, Helmet, Express Rate Limit, Zod |
| **DevOps** | Docker, Docker Compose, PostCSS |

---

## 🚀 Quick Start (Running Locally)

### 1. Prerequisites
- **Node.js** (v18.x, v20.x, or v24.x)
- **npm** (v9+ or v11+)
- *(Optional)* Local MongoDB or Docker (not required; in-memory MongoDB will auto-boot if no URI is provided).

### 2. Installation
From the root directory:
```bash
# Install root, backend, and frontend packages in one command
npm run install:all
```
*Or install separately:*
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Variables

#### Backend (`backend/.env`):
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173

# Leave blank to automatically start in-memory MongoDB ReplicaSet, or provide your URI:
MONGODB_URI=

JWT_ACCESS_SECRET=emr_super_secret_access_jwt_key_2026_production_grade
JWT_REFRESH_SECRET=emr_super_secret_refresh_jwt_key_2026_production_grade
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

### 4. Run the Project
To run both backend and frontend concurrently:
```bash
npm start
```
Or in two separate terminals:
- **Terminal 1 (Backend)**: `cd backend && npm run dev`
- **Terminal 2 (Frontend)**: `cd frontend && npm run dev`

Open your browser at: **`http://localhost:5173`**

---

## 🔑 Pre-Seeded Demo Accounts (One-Click Logins)

The system automatically initializes seed data on first launch:

| Role | Email | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@emr.com` | `password123` | Full access: doctor/receptionist creation, schedule management, audit trail. |
| **Receptionist** | `reception@emr.com` | `password123` | Front desk: patient search, slot booking, arrival check-in. |
| **Doctor (House)** | `house@emr.com` | `password123` | Clinical workstation: Diagnostics & Internal Medicine patients, clinical notes. |
| **Doctor (Grey)** | `grey@emr.com` | `password123` | General Surgery patients and consultation notes. |

*Note: The login page features quick one-click buttons to populate these credentials instantly.*

---

## 📚 API Documentation

### Consistent Response Standard
All endpoints follow a unified response schema:
```json
{
  "success": true,
  "message": "Human-readable status",
  "data": {},
  "meta": {}
}
```

### Core API Endpoints

#### 1. Authentication
- `POST /api/v1/auth/login` - Authenticate user, returns `{ accessToken, refreshToken, user }`.
- `POST /api/v1/auth/refresh` - Rotate and issue new access & refresh tokens.
- `POST /api/v1/auth/logout` - Invalidate refresh token and destroy session.
- `GET  /api/v1/auth/me` - Retrieve current authenticated profile.

#### 2. Doctors & Schedules
- `GET  /api/v1/doctors` - List active doctors (filter by `department`, `search`).
- `POST /api/v1/doctors` - *(Super Admin)* Create a new doctor with auto-generated default schedule.
- `POST /api/v1/doctors/receptionists` - *(Super Admin)* Create receptionist account.
- `GET  /api/v1/doctors/:doctorId/schedule` - Fetch doctor's weekly shift configuration.
- `PUT  /api/v1/doctors/:doctorId/schedule` - *(Super Admin)* Update doctor shift, sessions, breaks, and slot duration.

#### 3. Dynamic Slots Engine
- `GET  /api/v1/slots?doctorId=:id&date=YYYY-MM-DD` - Generates real-time slot matrix:
  - Validates working days.
  - Generates slots across morning/afternoon sessions.
  - Strips break periods (e.g. Lunch 12:00-13:00).
  - Cross-references existing bookings in database.
  - Disables past time slots if date is today.

#### 4. Appointments & Patients
- `GET  /api/v1/appointments/patients/search?query=:term` - Search patients by MRN ID, phone, or name.
- `POST /api/v1/appointments` - Book appointment with atomic concurrency guard.
- `GET  /api/v1/appointments` - Server-side paginated, sorted, and filtered appointments.
  - Query params: `page`, `limit`, `sortBy`, `sortOrder`, `doctorId`, `department`, `status`, `startDate`, `endDate`, `search`.
- `GET  /api/v1/appointments/:id` - Get appointment details (RBAC protected).
- `PUT  /api/v1/appointments/:id` - Update purpose, reception notes, consultation notes, or workflow status.
- `DELETE /api/v1/appointments/:id` - Cancel appointment with reason (releases slot for re-booking).
- `POST /api/v1/appointments/:id/arrive` - Mark patient as arrived in clinic lobby.
- `GET  /api/v1/appointments/audit-logs` - *(Super Admin)* Paginated compliance audit trail.

---

## 📂 Project Structure

```
emr-appointment-system/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js             # Mongoose connection + MongoMemoryReplSet fallback
│   │   │   └── socket.js         # Socket.IO WebSocket gateway & room broadcasting
│   │   ├── controllers/
│   │   │   ├── appointmentController.js
│   │   │   ├── authController.js
│   │   │   └── doctorController.js
│   │   ├── middlewares/
│   │   │   ├── auth.js           # JWT verification & RBAC authorize middleware
│   │   │   ├── errorHandler.js   # Centralized error handler (Mongoose, JWT, Zod)
│   │   │   └── validate.js       # Zod schema validation middleware
│   │   ├── models/
│   │   │   ├── Appointment.js    # Concurrency unique partial index
│   │   │   ├── AuditLog.js       # Action & compliance history
│   │   │   ├── DoctorSchedule.js # Shift, sessions, and break configuration
│   │   │   ├── Patient.js        # Demographics & indexed search
│   │   │   └── User.js           # Roles, bcrypt, and refresh token storage
│   │   ├── routes/
│   │   ├── services/             # Pure business logic layer
│   │   ├── utils/
│   │   │   ├── apiResponse.js    # Standardized response formats & AppError
│   │   │   ├── jwt.js            # JWT generator & validator
│   │   │   └── seeder.js         # Initial mock database seeder
│   │   ├── app.js                # Express app setup (Helmet, CORS, Morgan)
│   │   └── server.js             # HTTP/WS server bootstrap & graceful shutdown
│   ├── Dockerfile
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Responsive navigation & role indicators
│   │   │   └── ProtectedRoute.jsx# RBAC route guard
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # State management & token refresh lifecycle
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Authentication view with demo accounts
│   │   │   ├── Dashboard.jsx     # Live KPI overview & real-time socket stream
│   │   │   ├── Scheduler.jsx     # Interactive dynamic slot grid & filter engine
│   │   │   ├── BookAppointment.jsx # Patient lookup/creation & slot booking
│   │   │   ├── AppointmentList.jsx # Paginated list, status workflow, and clinical notes
│   │   │   ├── StaffManagement.jsx # Super Admin doctor & shift schedule manager
│   │   │   └── AuditLogs.jsx     # Compliance audit trail viewer
│   │   ├── services/
│   │   │   ├── api.js            # Axios client with automatic refresh token interceptor
│   │   │   └── socket.js         # Socket.IO client singleton
│   │   ├── App.jsx               # Route definitions
│   │   └── main.jsx
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml            # Complete multi-container orchestration
├── ENGINEERING_DECISIONS.md      # Detailed architectural & engineering report
└── README.md
```

---

## 🐳 Docker Deployment (Optional Bonus)

Run the entire cluster with a single command:
```bash
docker-compose up --build
```
This launches:
- **MongoDB** on `localhost:27017`
- **Backend API** on `localhost:5000`
- **Frontend App** on `localhost:5173`

---

## 📄 Engineering Decisions Document
Detailed explanations answering all mandatory architectural evaluation criteria can be found in [ENGINEERING_DECISIONS.md](file:///d:/Programming/TEMP/emr-appointment-system/ENGINEERING_DECISIONS.md).
