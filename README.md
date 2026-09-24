# CampusResolve — Student Support & Ticket Management System

An enterprise-grade, full-stack institutional ticket management and SLA resolution platform engineered for universities, colleges, and higher-education institutions.

CampusResolve streamlines and modernizes campus administrative requests (Fees, Attendance, ID Cards, Certificates, Examinations, Scholarships, Hostel, Transport, and Technical Support) through transparent ownership, role-based workflows, strict SLA tracking, and complete audit accountability.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Frontend                         │
│  - React 19 + TypeScript + Tailwind CSS                    │
│  - Recharts Visualizations & Analytics                      │
│  - Role-Scoped Portals (Student, Staff, Admin)             │
│  - 1-Click Recruiter Demo Persona Switcher                 │
└──────────────────────────────┬──────────────────────────────┘
                               │  REST / JSON (JWT Bearer Auth)
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Backend API                    │
│  - Node.js + TypeScript (Strict mode)                      │
│  - Modular Router -> Controller -> Service -> Model        │
│  - JWT Authentication & Role Authorization Middleware       │
│  - Strict Zod Input Validation & Error Handling             │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│  - Finite State Machine (Status Transitions)                │
│  - Atomic Concurrency Engine (Claiming / Assignment)        │
│  - Dynamic SLA Engine (Real-time Breaches & Ageing)         │
│  - Information Request / Student Reply Auto-Resume Flow     │
│  - Strict Privacy Guard (Internal Notes hidden from Student)│
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Prisma ORM Client                       │
│  - Type-safe schema models & query generation               │
│  - Database transactions & cascade management               │
└──────────────────────────────┬──────────────────────────────┘
                               │  PostgreSQL Protocol
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                  PostgreSQL 18 Database                     │
│  - Relations, foreign keys, unique constraints              │
│  - Targeted B-tree indexes for high-throughput queries      │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Features & Business Workflows

### Role-Based Access Control (RBAC)
- **Student**:
  - Secure registration and login.
  - Create support tickets with title, category, priority, description, and optional file attachments.
  - Automatic human-readable ticket numbers (`TKT-2026-00001`) separate from internal UUIDs.
  - Strict privacy isolation: Students **never** see another student's tickets (enforced in database queries).
  - Public discussion thread with department officers.
  - Respond to staff requests for information (automatically resumes status to `IN_PROGRESS`).
  - Accept and close resolved tickets or reopen with an explanatory reason.
- **Staff (Department Officers)**:
  - Department-specific and assigned queue dashboards.
  - Claim unassigned tickets with atomic concurrency control (prevents double-claiming).
  - Status progression (`OPEN` -> `ASSIGNED` -> `IN_PROGRESS` -> `WAITING_FOR_STUDENT` -> `RESOLVED`).
  - Private **Internal Notes** (clearly differentiated and strictly filtered out of student responses).
  - Request additional documentation from students.
  - Real-time SLA warning badges (`WITHIN_SLA`, `DUE_SOON`, `OVERDUE`).
- **Administrator (Deans / Directors)**:
  - System-wide executive dashboard with Recharts analytics.
  - Metrics: Total tickets, open tickets, resolved tickets, overdue tickets, SLA compliance rate (%), and average resolution time.
  - Breakdown charts: Tickets by Category, Tickets by Status, Ageing Distribution (0–1d, 2–3d, 4–7d, 8+d), and Staff Workload (Active vs Resolved).
  - SLA breaches and overdue escalations table.
  - Category and SLA policy configuration.
  - Staff reassignment and multi-tier administrative escalation (`LEVEL_1`, `LEVEL_2`).

---

## 3. SLA & Ageing Engine

Each ticket calculates its SLA targets dynamically based on priority:

| Priority | Default SLA Target | Warning Threshold | Description |
| :--- | :--- | :--- | :--- |
| **URGENT** | **8 Hours** | 2 Hours before due | Exam blockers, server outage, urgent security issues |
| **HIGH** | **24 Hours** | 6 Hours before due | Time-sensitive requests, hall tickets, double payments |
| **MEDIUM** | **48 Hours** | 12 Hours before due | Attendance condonation, scholarships, room maintenance |
| **LOW** | **72 Hours** | 18 Hours before due | Duplicate ID cards, bonafide certificates, transcripts |

### SLA Status Classification:
- **`WITHIN_SLA`**: Ticket is active and comfortably ahead of the warning threshold.
- **`DUE_SOON`**: Active ticket has entered the warning window.
- **`OVERDUE`**: Active ticket has passed `slaDueAt` without resolution.
- **`MET`**: Resolved ticket whose `resolvedAt <= slaDueAt`.
- **`BREACHED`**: Resolved ticket whose `resolvedAt > slaDueAt`.

### Ticket Ageing Buckets:
Calculated dynamically from `createdAt`:
- `0–1 Days` (< 48 hours)
- `2–3 Days` (48 to 96 hours)
- `4–7 Days` (96 to 192 hours)
- `8+ Days` (192+ hours)

---

## 4. Ticket Lifecycle State Transitions

```text
                  ┌──────────────────────┐
                  │         OPEN         │
                  └──────────┬───────────┘
                             │
            ┌────────────────┼────────────────┐
            ▼                ▼                ▼
     ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
     │   ASSIGNED   │ │ IN_PROGRESS  │ │   RESOLVED   │
     └──────┬───────┘ └──────┬───────┘ └──────────────┘
            │                │
            └───────┬────────┘
                    ▼
          ┌─────────────────────┐
          │     IN_PROGRESS     │◄────────────┐
          └─────────┬───────────┘             │
                    │                         │ Student replies
            ┌───────┴──────────────┐          │ to ticket
            ▼                      ▼          │
  ┌───────────────────┐  ┌───────────────────┐│
  │WAITING_FOR_STUDENT│  │     RESOLVED      ││
  └─────────┬─────────┘  └─────────┬─────────┘│
            │                      │          │
            │ Student responds     ├──────────┼───────┐
            └──────────────────────┘          ▼       ▼
                                       ┌──────────┐ ┌──────────┐
                                       │  CLOSED  │ │ REOPENED │
                                       └──────────┘ └────┬─────┘
                                                         │
                                                         └──────────► IN_PROGRESS
```

---

## 5. Seeded Demo Accounts

The database comes pre-seeded with realistic institutional accounts and **22+ varied tickets** covering all edge cases (overdue, urgent, waiting-for-student, resolved within SLA, SLA breached, unassigned, reopened):

| Role | Name | Email | Password | Department / Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Rajesh Sharma | `admin@campusresolve.demo` | `Admin@123` | Dean of Students / Full Access |
| **Staff** | Priya Sharma | `staff@campusresolve.demo` | `Staff@123` | Finance & Accounts (`FIN`) |
| **Staff** | Rahul Verma | `staff.it@campusresolve.demo` | `Staff@123` | IT Services (`IT`) |
| **Staff** | Anjali Nair | `staff.acad@campusresolve.demo` | `Staff@123` | Academic & Exams (`ACAD`) |
| **Staff** | Vikram Singh | `staff.hostel@campusresolve.demo` | `Staff@123` | Student Welfare & Hostel (`HOSTEL`) |
| **Student** | Aarav Patel | `student@campusresolve.demo` | `Student@123` | STU-2024-001 (Computer Science) |
| **Student** | Sneha Kulkarni | `student2@campusresolve.demo` | `Student@123` | STU-2024-045 (Electronics) |
| **Student** | Rohan Gupta | `student3@campusresolve.demo` | `Student@123` | STU-2024-112 (Mechanical) |

> **Pro Tip**: The application features a **1-Click Demo Persona Switcher** directly in the top navbar and on the login page, allowing instant switching between roles during technical interviews without typing.

---

## 6. Getting Started

### Prerequisites
- **Node.js**: v18.0.0+ (Tested on v24.14.0)
- **PostgreSQL**: v14+ (PostgreSQL 18 running on port `5433` or standard `5432`)
- **npm**: v9+

### Backend Setup
1. Open a terminal in `./backend`:
   ```bash
   cd backend
   npm install
   ```
2. Verify environment configuration in `./backend/.env`:
   ```env
   DATABASE_URL="postgresql://postgres@localhost:5433/campus_resolve?schema=public"
   JWT_SECRET="campus-resolve-super-secret-jwt-key-2026"
   JWT_EXPIRES_IN="7d"
   PORT=4000
   FRONTEND_URL="http://localhost:3000"
   NODE_ENV="development"
   ```
3. Push Prisma schema & Seed the database:
   ```bash
   npm run prisma:push
   npm run prisma:seed
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend API will start at `http://localhost:4000`.*

### Frontend Setup
1. Open a second terminal in `./frontend`:
   ```bash
   cd frontend
   npm install
   ```
2. Verify `./frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   *The frontend application will start at `http://localhost:3000`.*

---

## 7. Automated Testing

Comprehensive test suites validate business logic, state machines, SLA math, and security:

```bash
cd backend
npm test
```

### Verified Test Cases:
1. Default SLA hours for each priority tier.
2. SLA due date computation from creation timestamp.
3. Overdue detection for elapsed deadlines.
4. Resolved tickets classified as `MET` vs `BREACHED`.
5. Ageing duration categorization (0–1d, 2–3d, 4–7d, 8+d).
6. Valid state transitions allowed; invalid transitions rejected.
7. Role-based authorization: Students blocked from admin analytics (HTTP 403).
8. Admin authorization: Deans access executive analytics (HTTP 200).
9. Comment privacy: Students cannot create `INTERNAL` notes (HTTP 403).
10. Cross-student data isolation: Student B cannot view Student A's ticket.

---

## 8. REST API Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new student account.
- `POST /api/auth/login` — Authenticate and receive JWT access token.
- `GET /api/auth/me` — Retrieve active authenticated user profile.
- `GET /api/staff` — List active department officers for assignment.

### Tickets (`/api/tickets`)
- `POST /api/tickets` — Submit ticket with optional file attachment.
- `GET /api/tickets` — List tickets with role-based scoping, search, filters, and pagination.
- `GET /api/tickets/:id` — Retrieve ticket details, public comments, attachments, and timeline.
- `PATCH /api/tickets/:id/status` — Move ticket through valid state transitions.
- `PATCH /api/tickets/:id/claim` — Concurrency-safe ticket claim for staff.
- `PATCH /api/tickets/:id/assign` — Assign or reassign ticket to department officer.
- `PATCH /api/tickets/:id/priority` — Update priority level with reason and SLA adjustment.
- `PATCH /api/tickets/:id/escalate` — Trigger Level 1 / Level 2 administrative escalation.
- `POST /api/tickets/:id/reopen` — Reopen eligible resolved ticket with reason.
- `POST /api/tickets/:ticketId/comments` — Add public reply or private internal note.
- `GET /api/tickets/:ticketId/comments` — Fetch ticket comments (internal notes filtered for students).
- `GET /api/tickets/:ticketId/activity` — Retrieve immutable audit trail.

### Categories & SLAs (`/api/categories`)
- `GET /api/categories` — List active categories with department associations.
- `GET /api/categories/departments` — List departments and counts.
- `POST /api/categories` — (Admin) Create complaint category.
- `PATCH /api/categories/:id` — (Admin) Update category SLA hours or active status.

### Analytics (`/api/analytics`)
- `GET /api/analytics/student` — Metrics cards and action-required items for student.
- `GET /api/analytics/staff` — Assigned queue, due soon, and overdue tickets for staff.
- `GET /api/analytics/admin` — Executive analytics, charts data, and SLA breach reports.

---

## 9. Engineering Trade-offs & Architecture Decisions

1. **Stateless JWT vs. Stateful Sessions**:
   - *Decision*: JWT access tokens with structured payload.
   - *Rationale*: Keeps the backend API stateless, horizontally scalable, and decoupled from frontend rendering.
2. **Calculated SLA & Ageing vs. Stored Booleans**:
   - *Decision*: Derived dynamically from timestamps (`createdAt`, `slaDueAt`, `resolvedAt`).
   - *Rationale*: Eliminates race conditions and prevents database drift where a static `isOverdue: false` becomes obsolete without a recurring cron job.
3. **Atomic Concurrency for Ticket Claiming**:
   - *Decision*: Implemented in a database transaction verifying `assignedStaffId IS NULL`.
   - *Rationale*: When two staff members attempt to claim the same high-priority ticket simultaneously, only one succeeds and the second receives a clean HTTP 409 Conflict.
4. **Relational PostgreSQL vs. Document Database**:
   - *Decision*: PostgreSQL with Prisma ORM.
   - *Rationale*: Educational ticketing requires referential integrity between users, departments, categories, comments, and audit events, as well as fast SQL aggregations for management reporting.

---

## 10. Future Improvements
- Multi-factor authentication (MFA) via campus email OTP.
- Business-hours-aware SLA calculation (skipping weekends and university holidays).
- Webhook notifications for Slack/Teams channels on SLA breach.
- AI-assisted ticket triage and automatic categorization based on description embeddings.
