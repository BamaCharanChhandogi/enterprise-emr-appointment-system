# Engineering Decisions & System Design

This document covers the architectural choices, trade-offs, and technical rationale behind our Enterprise EMR Appointment System.

---

### 1. Why Did You Choose Your Project Architecture?

We structured the backend into **Routes → Middlewares → Controllers → Services → Models**:

- **Controllers are thin**: Their only job is receiving the HTTP request, extracting parameters, calling the service, and returning a consistent JSON response.
- **Business logic lives entirely in Services**: All the real rules—like generating non-overlapping slots, skipping lunch breaks, blocking past slots, checking double-booking, and cascading cancellations—are inside `appointmentService`, `slotService`, and `doctorService`. If we ever switch from REST to GraphQL or tRPC, zero business logic needs to be rewritten.
- **Frontend State**: We used React Context for authentication and an Axios instance with a response interceptor to handle automatic token refresh. For application state, we kept state close to the components that need it (with custom hooks and Socket.IO events) instead of pulling in heavy Redux boilerplate for features that are already synchronized via WebSockets.

---

### 2. How Did You Design Your MongoDB Schema?

We designed the schema around how a hospital actually operates:

1. **Separation of Staff and Patients**:
   - `User` is strictly for hospital staff (`SUPER_ADMIN`, `RECEPTIONIST`, `DOCTOR`) who authenticate with credentials.
   - `Patient` is for patient medical records (`patientId`, demographics, medical history). Patients do not have login access in an internal EMR.
2. **Dynamic Schedule vs Static Slots**:
   - Storing pre-generated empty slot rows for every doctor weeks in advance is an anti-pattern—it clutters the database with millions of unbooked documents.
   - Instead, `DoctorSchedule` stores the doctor's weekly working template: working days, morning/afternoon sessions, lunch break hours, and slot duration (e.g., 15m). Slots are calculated dynamically in-memory when requested.
3. **Strings for Dates and Times**:
   - Dates are stored as ISO strings (`YYYY-MM-DD`, e.g., `"2026-10-15"`) and times as 24-hour strings (`"09:00"`, `"13:30"`).
   - In healthcare, JavaScript `Date` objects cause subtle timezone bugs (e.g. a 9:00 AM appointment shifting to 2:30 PM UTC when viewed from another workstation). String representation guarantees the exact calendar date and slot time stay identical across all hospital terminals.

---

### 3. How Did You Prevent Double Booking? (Concurrency Strategy)

Double-booking prevention cannot rely on simple `if (!slot.isBooked)` checks in Node.js because two concurrent clicks will both pass the check before either write completes (classic race condition / TOCTOU bug).

We solved this with a **three-tier concurrency defense**:

1. **Database-Level Partial Unique Index (Primary Lock)**:
   We created a compound partial unique index on the `appointments` collection:
   ```javascript
   appointmentSchema.index(
     { doctor: 1, date: 1, slotStartTime: 1 },
     {
       unique: true,
       partialFilterExpression: { status: { $in: ['Scheduled', 'Arrived', 'Completed'] } }
     }
   );
   ```
   If two receptionists submit a booking for the same doctor at `09:15` on the exact same millisecond, MongoDB's atomic index write allows one to succeed and immediately throws duplicate key error `E11000` on the other.
2. **Instant Slot Recycling via Partial Filter**:
   Because the unique constraint only applies to active statuses (`Scheduled`, `Arrived`, `Completed`), when an appointment is marked `Cancelled`, the constraint is instantly released for that slot. Other patients can immediately book that time without needing manual DB cleanups.
3. **Real-Time WebSocket Lock**:
   When a booking or cancellation happens, the server broadcasts `slot_status_changed` to that doctor's room. Other staff viewing the scheduler see the slot turn gray (`Booked`) live without needing to refresh.

---

### 4. Which Database Indexes Did You Create and Why?

| Collection | Index | Purpose |
| :--- | :--- | :--- |
| **appointments** | `{ doctor: 1, date: 1, slotStartTime: 1 }` (Unique Partial) | Hard concurrency lock against double-booking active slots. |
| **appointments** | `{ doctor: 1, date: 1, status: 1 }` | Powers the dynamic slot generator to quickly fetch booked slots for the day. |
| **appointments** | `{ appointmentNumber: 1 }` (Unique) | O(1) lookup when receptionist searches or prints a token slip. |
| **patients** | `{ patientId: 1 }`, `{ phone: 1 }` (Unique) | Fast patient demographic lookups by MRN or mobile number. |
| **patients** | `{ name: "text", phone: "text", patientId: "text" }` | Text search index for receptionist auto-complete search bar. |
| **auditlogs** | `{ timestamp: -1 }`, `{ action: 1 }` | Fast chronological pagination for hospital compliance reviews. |

---

### 5. What Security Measures Did You Implement?

- **JWT Dual-Token Rotation**: 15-minute access token + 7-day refresh token stored in the database. When the client calls `/auth/refresh`, the old refresh token is rotated. Logging out immediately revokes the refresh token from the database.
- **Password Security**: Passwords hashed with `bcryptjs`. The password field has `select: false` in the Mongoose schema so queries like `User.find()` never leak password hashes in API responses.
- **Strict Server-Side RBAC**: Role verification is enforced in middleware, not just UI visibility. For example, when a Doctor calls `/api/v1/appointments`, the backend overrides any doctor query filter with `req.user.id`, ensuring doctors can never view or modify appointments belonging to colleagues.
- **Zero Raw Error Leaks**: Database connection strings, stack traces, and internal IDs are stripped in API responses. User-facing messages use clean clinical terminology.
- **Rate Limiting & Helmet**: `express-rate-limit` protects authentication routes from brute force attacks; `helmet` secures HTTP response headers.

---

### 6. What Performance Optimizations Did You Apply?

1. **In-Memory Slot Generation**:
   Calculating 20–30 appointment slots for a day in JavaScript arithmetic takes under **1 millisecond**. We never write millions of blank slot documents to disk.
2. **Query Optimization with `.lean()` and `.select()`**:
   Read queries use `.lean()` to bypass Mongoose model hydration overhead and `.select()` to return only necessary fields, cutting memory and JSON serialization time in half.
3. **Targeted Socket.IO Rooms**:
   Instead of broadcasting every appointment update to every connected browser in the hospital, clients join rooms by `schedule_${doctorId}_${date}`. Only users actively looking at that physician's schedule receive slot updates.
4. **Vite Production Bundling**:
   Frontend assets are minified with code splitting and tree-shaking, resulting in sub-second load times.

---

### 7. If This Application Needed to Support Millions of Appointments, What Architectural Changes Would You Make?

If this hospital system scaled to 50+ hospital branches handling millions of appointments per month:

1. **MongoDB Sharding**:
   Shard the `appointments` collection using a compound shard key `{ doctor: 1, date: 1 }`. Almost all hospital queries target a specific doctor on a given day, meaning reads and writes will route directly to a single shard without cross-shard scatter-gather queries.
2. **Distributed Caching (Redis Cluster)**:
   Cache static physician shift configs in Redis (`doc_schedule:${id}`) with a 24-hour TTL, invalidated only when an admin edits shifts. Keep current-day available slots in Redis Bitmaps for instant availability checks.
3. **Distributed Locking (Redis Redlock)**:
   Across a multi-server cluster, place a short 2-second Redis mutex lock on `lock:slot:${docId}:${date}:${time}` while the booking transaction writes to MongoDB, preventing database write contention.
4. **Read/Write Splitting (CQRS)**:
   Route write requests (booking, check-in, cancellations) to the primary replica. Route heavy read operations (audit logs, search, historical lists) to MongoDB secondary read replicas (`readPreference=secondaryPreferred`).
5. **Asynchronous Background Processing (BullMQ / RabbitMQ)**:
   Move patient email notifications, SMS token alerts, and audit log writes to background worker queues so the appointment booking HTTP endpoint returns in under 30ms without blocking on external mail delivery.
