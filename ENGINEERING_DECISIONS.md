# ENGINEERING DECISIONS & ARCHITECTURAL SPECIFICATION

## Enterprise Electronic Medical Record (EMR) Appointment Management System

---

### 1. Why Did You Choose Your Project Architecture?

We selected a **Clean N-Tier Layered Architecture** with strict **Separation of Concerns (SoC)** for the backend and a **Modular Domain-Driven Structure** for the frontend:

```
[ HTTP / REST Clients ] ──▶ [ Controllers (Lightweight orchestrators) ]
                                    │
                                    ▼
                         [ Services (Pure Business Logic) ]
                                    │
                         ┌──────────┴──────────┐
                         ▼                     ▼
                [ Mongoose Models ]    [ Socket.IO / Audit Log ]
                         │
                         ▼
                [ MongoDB Database ]
```

#### Rationale:
1. **Lightweight Controllers**: Controllers are strictly responsible for parsing HTTP inputs, invoking the corresponding service method, and returning standardized API responses. Zero business rules are written inside controllers.
2. **Business Logic in Services**: All validation logic, time calculations (breaks, slot generation, past dates), and transaction flows reside inside service classes (`doctorService.js`, `appointmentService.js`, `authService.js`). This makes the application testable and decoupled from the transport layer.
3. **Defense-in-Depth Middleware**: Authentication, Role-Based Access Control (`authorize`), and input schema validation with **Zod** are implemented as pipeline middlewares before requests ever touch controllers.
4. **WebSocket Decoupling**: The real-time notification engine operates as an observer pattern (`emitAppointmentUpdate`), broadcasting to specific rooms (`schedule_{doctorId}_{date}`) as well as global dashboard listeners without coupling business transactions to network sockets.

---

### 2. How Did You Design Your MongoDB Schema?

The schema models real-world enterprise healthcare structures with normalized relationships where data integrity is paramount, and embedded structures where query efficiency is maximized:

```
┌─────────────────┐            ┌──────────────────────┐
│      User       │1          1│    DoctorSchedule    │
│  (Auth & RBAC)  ├────────────┤ (Sessions & Breaks)  │
└────────┬────────┘            └──────────────────────┘
         │
         │ 1:N (Doctor)
         ▼
┌─────────────────┐            ┌──────────────────────┐
│   Appointment   │N          1│       Patient        │
│ (Active Booking)├────────────┤ (Demographic Record) │
└─────────────────┘            └──────────────────────┘
```

1. **`User` (Staff & Auth)**:
   - Stores Super Admins, Receptionists, and Doctors.
   - Roles are strictly enumerated (`SUPER_ADMIN`, `RECEPTIONIST`, `DOCTOR`).
   - Password hashes (`bcryptjs`) are marked with `select: false` to ensure passwords are never leaked through queries.
   - Supports an array of active `refreshTokens` with automated expiration for JWT rotation.

2. **`DoctorSchedule` (Master Availability)**:
   - Embedded weekly schedule array (`Monday` through `Sunday`).
   - Each day contains `sessions` (e.g., `09:00 - 12:00`, `13:00 - 17:00`), `breaks` (e.g., `12:00 - 13:00`), and configurable `slotDuration` (15, 30, etc.).
   - Kept separate from appointments so slot calculations are generated dynamically on demand, saving massive database storage.

3. **`Patient`**:
   - Unique medical record identifier (`patientId`, e.g., `PAT-100201`), phone number, demographic details.
   - Text indexing enables instant sub-second lookup by name, phone, or MRN.

4. **`Appointment`**:
   - Stores appointment number, references to `patient`, `doctor`, `date` (formatted as ISO `YYYY-MM-DD` string to eliminate timezone drift across timezones), `slotStartTime`, `slotEndTime`, `status`, and clinical notes.

5. **`AuditLog`**:
   - Append-only collection recording `user`, `role`, `action`, `entity`, `entityId`, timestamp, IP address, and payload snapshot for compliance and accountability.

---

### 3. How Did You Prevent Double Booking? (Concurrency Strategy)

Double-booking prevention is designed using a **multi-layered, fail-safe concurrency strategy**:

#### Layer 1: Database-Level Partial Unique Compound Index (Ultimate Guarantee)
We enforce a partial unique compound index at the MongoDB storage engine level:
```javascript
appointmentSchema.index(
  { doctor: 1, date: 1, slotStartTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ['Scheduled', 'Arrived', 'Completed'] } },
    name: 'unique_active_doctor_slot'
  }
);
```
- **Why this works**: If two receptionists click "Book" on the exact same second for `Dr. House` at `09:00 AM on 2026-10-25`, the MongoDB engine uses atomic B-Tree leaf insertion locks. Exactly **one** document is written; the concurrent request fails with MongoDB duplicate key error code `E11000`.
- **Cancelled Slots Reusability**: Using `partialFilterExpression: { status: { $in: ['Scheduled', 'Arrived', 'Completed'] } }`, once an appointment status is changed to `Cancelled`, the unique constraint is released for that slot, allowing another patient to book it immediately without manual cleanup!

#### Layer 2: Service-Level Atomic Verification (Pre-Flight Lock)
Before inserting, `appointmentService.js` performs an explicit active slot query and translates duplicate conflicts into an HTTP `409 Conflict` with clear feedback to the user:
> *"Conflict: The time slot 09:00 on 2026-10-25 for this doctor has already been booked by another user. Please choose another slot."*

#### Layer 3: Real-Time WebSocket Push (Pre-Emptive Conflict Prevention)
When an appointment is created or cancelled, the backend emits `slot_status_changed` to the specific Socket.IO room `schedule_{doctorId}_{date}`. Every client viewing that schedule immediately turns that slot gray (`Booked`) without requiring a page refresh, reducing race conditions at the human UI level.

---

### 4. Which Database Indexes Did You Create and Why?

| Collection | Index Keys | Type | Purpose |
| :--- | :--- | :--- | :--- |
| **appointments** | `{ doctor: 1, date: 1, slotStartTime: 1 }` | Unique Partial Index | **Concurrency lock**: Prevents double-booking active slots for any doctor. |
| **appointments** | `{ doctor: 1, date: 1, status: 1 }` | Compound Index | Optimizes scheduler lookups when computing open vs booked slots for a specific day. |
| **appointments** | `{ appointmentNumber: 1 }` | Unique B-Tree | Fast lookup for appointment check-in, arrival, and updates. |
| **patients** | `{ patientId: 1 }`, `{ phone: 1 }` | Unique / Single | Instant patient record retrieval by Mobile or Hospital MRN. |
| **patients** | `{ name: "text", phone: "text", patientId: "text" }` | Text Index | Auto-complete fuzzy searching during reception desk intake. |
| **auditlogs** | `{ action: 1, timestamp: -1 }` | Compound Index | Enables high-performance server-side paginated queries for compliance audits. |

---

### 5. What Security Measures Did You Implement?

1. **JWT Dual-Token Pattern**:
   - Short-lived Access Token (15 minutes).
   - Long-lived Refresh Token (7 days) stored encrypted and rotated upon every refresh.
   - Refresh token revocation on logout to terminate stolen sessions.
2. **Password Hashing**:
   - `bcryptjs` with salt factor 10. `select: false` prevents accidental exposure in REST responses.
3. **Role-Based Access Control (RBAC)**:
   - Dedicated middleware (`authorize('SUPER_ADMIN', 'RECEPTIONIST')`).
   - Doctors are physically restricted from viewing or modifying records belonging to other doctors.
4. **Input Sanitization & Schema Validation**:
   - Strict **Zod schemas** validate query parameters, body payloads, and route arguments, rejecting injection payloads and malformed dates/times.
5. **Defensive HTTP Headers & Throttling**:
   - `helmet` sets secure HTTP headers (XSS, HSTS, frameguard).
   - `express-rate-limit` throttles brute-force attempts on authentication endpoints (max 100 requests per 15 mins).
   - Standardized error serializer strips stack traces in non-development environments.

---

### 6. What Performance Optimizations Did You Apply?

1. **Dynamic Slot Calculation (On-The-Fly Generation)**:
   - Rather than storing millions of empty slots in the database, slots are computed dynamically based on the doctor's weekly shift config in sub-milliseconds (`O(N)` where $N \le 40$ slots/day).
2. **Database Query Projections & `.lean()`**:
   - Queries use `.select('name email department')` and `.lean()` to bypass Mongoose document hydration overhead on heavy list reads.
3. **Compound Indexes**:
   - Covers queries to guarantee index-only scans (`IXSCAN`) rather than full collection scans (`COLLSCAN`).
4. **Targeted WebSocket Rooms**:
   - Socket clients subscribe to `schedule_{doctorId}_{date}` rooms so slot updates are routed only to interested users rather than broadcasting to the entire hospital network.
5. **Component Memoization & Vite Bundling**:
   - Split vendor chunks and tree-shaken Lucide icons in Vite for sub-second page loads.

---

### 7. If This Application Needed to Support Millions of Appointments, What Architectural Changes Would You Make?

If scaling from thousands to tens of millions of appointments per month:

1. **Database Sharding (MongoDB Cluster)**:
   - Shard the `appointments` collection on a compound shard key: `{ doctor: 1, date: 1 }`.
   - This ensures all appointment checks and slot lookups for a doctor route to a single shard, avoiding cross-shard fan-out overhead.
2. **Distributed Caching (Redis Cluster)**:
   - Cache doctor shift configurations (`DoctorSchedule`) in Redis with TTL and invalidate upon update.
   - Cache pre-generated available slots in Redis Bitmaps or sets (`slot:doc123:2026-10-25`).
3. **Distributed Locking for Race Conditions (Redis Redlock)**:
   - Implement `Redlock` with a 5-second lease on `lock:slot:doc123:2026-10-25:09:00` while database writes complete, guaranteeing concurrency across multi-region server clusters.
4. **Read/Write Replica Splitting (CQRS)**:
   - Direct read queries (Scheduler views, audit history, analytical dashboards) to MongoDB secondary read replicas (`readPreference=secondaryPreferred`).
   - Direct writes and bookings to the primary replica.
5. **Message Queuing & Event Streaming (Apache Kafka / RabbitMQ)**:
   - Decouple audit logging, SMS/Email appointment confirmations, and EHR analytics through a Kafka topic (`appointment-events`) consumed asynchronously by background workers.
6. **Horizontal API Scaling with Socket.IO Redis Adapter**:
   - Run multiple Node.js Express instances behind an NGINX or AWS ALB load balancer.
   - Use `@socket.io/redis-adapter` to synchronize real-time WebSocket events across multiple Node server nodes seamlessly.
