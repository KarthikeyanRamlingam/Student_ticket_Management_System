# AI Usage Report — CampusResolve

This document explains the role and usage of AI tools during the architectural design, implementation, and testing of **CampusResolve — Student Support & Ticket Management System** in accordance with recruitment assignment guidelines.

---

## 1. AI Tool Used
- **Primary Tool**: Google DeepMind Antigravity AI Pair Programmer (Gemini 3.8 Flash Engine).
- **Environment**: Antigravity IDE on Windows 11.

---

## 2. Tasks AI Assisted With
- Scaffolding the decoupled **Next.js (Frontend)** and **Express.js (Backend)** project structure.
- Designing the normalized PostgreSQL Prisma schema (`schema.prisma`) including enums, foreign keys, cascade rules, and indexes.
- Generating a realistic database seed script (`seed.ts`) with 22+ tickets covering diverse departments, SLA deadlines, and edge cases.
- Implementing the Finite State Machine (FSM) enforcing status transitions and restricting invalid state jumps.
- Writing mathematical routines for SLA due dates, remaining hours, overdue detection, and ageing distribution buckets.
- Formulating Jest automated unit and integration tests for role-based authorization, comment privacy, and state transitions.
- Building responsive React UI components with Tailwind CSS and Recharts visualizations.

---

## 3. Most Useful Prompt
```text
"Build a centralized ticket management platform with Role-Based Access Control (Student, Staff, Admin), 
dynamic SLA calculations based on priority, atomic concurrency for ticket claiming, 
strict privacy where internal staff notes are never exposed to students, 
and a pending-action workflow where a student reply to a WAITING_FOR_STUDENT ticket automatically resumes it to IN_PROGRESS."
```

---

## 4. Code Generated With AI Assistance
- **Backend Infrastructure**:
  - Express app configuration, CORS, and centralized error handling middleware (`errorHandler.ts`).
  - JWT token verification and RBAC middleware (`auth.ts`).
  - Zod request validators for auth, tickets, comments, and categories.
  - Prisma seed script (`seed.ts`).
- **Service Layer**:
  - `ticket.service.ts`: State machine transitions, atomic claim transaction, and ticket creation with auto sequential numbering (`TKT-2026-xxxxx`).
  - `comment.service.ts`: Public discussion vs internal note handling, auto-transition on student reply.
  - `slaCalculator.ts`: Dynamic computation of SLA statuses (`WITHIN_SLA`, `DUE_SOON`, `OVERDUE`, `MET`, `BREACHED`) and ageing duration buckets (`0–1d`, `2–3d`, `4–7d`, `8+d`).
  - `analytics.service.ts`: Real-time SQL aggregations for student, staff, and admin management dashboards.
- **Frontend Architecture**:
  - Next.js App Router pages: `/login`, `/register`, `/dashboard`, `/tickets`, `/tickets/[id]`, `/categories`.
  - Recharts visualizations for Category distribution, Ageing analysis, Status breakdown, and Staff Workload.
  - UI components: `StatusBadge`, `PriorityBadge`, `SlaBadge`, `TicketListTable`, `CreateTicketModal`, `Navbar`, and `Sidebar`.

---

## 5. Code Personally Reviewed and Modified
- **Prisma Schema Constraints**:
  - Reviewed relations to ensure cascade deletes on `TicketComment`, `TicketActivity`, and `Attachment` when tickets are pruned in test teardown.
  - Added composite indexes on `[status]`, `[priority]`, `[studentId]`, `[assignedStaffId]`, and `[slaDueAt]` for fast dashboard queries.
- **Atomic Claim Concurrency**:
  - Enhanced the claiming logic to execute inside a Prisma interactive transaction `$transaction` checking whether `assignedStaffId` was already populated, throwing a clean HTTP 409 Conflict if another staff officer claimed the ticket concurrently.
- **Privacy Enforcement at Query Level**:
  - Modified ticket retrieval and comment queries to filter `visibility: 'PUBLIC'` directly at the Prisma query level when the authenticated user is a `STUDENT`, ensuring confidential notes are never transmitted over the wire.
- **Next.js 16 Suspense Boundary**:
  - Identified and fixed Next.js static prerender bailout on `/tickets` caused by `useSearchParams()` by wrapping the client consumer inside `<Suspense>`.

---

## 6. Incorrect or Suboptimal AI Output Encountered
1. **Missing Next.js Suspense Boundary**:
   - *Problem*: In Next.js App Router, using `useSearchParams()` in a client component during `npm run build` triggers a prerender error: `useSearchParams() should be wrapped in a suspense boundary`.
   - *Identification*: Caught during production build validation (`npm run build`).
   - *Fix*: Extracted the query consumer into a subcomponent `TicketsContent` and wrapped it inside `<Suspense fallback={<Loader2 />}>`.
2. **Bash Syntax in Windows Shell Command**:
   - *Problem*: AI proposed a bash pipe syntax `<(echo password)` inside PowerShell, which was rejected by Windows PowerShell parser.
   - *Identification*: PowerShell reported `The ampersand (&) character is not allowed`.
   - *Fix*: Initialized the PostgreSQL cluster with `-A trust -U postgres` directly, eliminating the need for an external password pipe during local bootstrap.

---

## 7. Validation Performed
- **Automated Tests**:
  - Ran Jest test suite (`npm test`): 11 tests passed across SLA mathematics, state machine transitions, role authorization, and comment privacy.
- **End-to-End Simulation**:
  - Automated lifecycle verification script simulating:
    1. Student account login & ticket submission (`TKT-2026-00022`).
    2. Staff login & ticket claim with status update (`ASSIGNED`).
    3. Staff internal note creation and verification of privacy filter.
    4. Staff requesting information from student (`WAITING_FOR_STUDENT`).
    5. Student response triggering automatic transition back to `IN_PROGRESS`.
    6. Staff resolution with SLA compliance check (`RESOLVED`, `MET`).
    7. Student acceptance and closure (`CLOSED`).
- **Production Compilation**:
  - Backend TypeScript: `npx tsc --noEmit` exited with code 0.
  - Frontend Next.js: `npm run build` compiled all 9 routes with 0 errors and 0 warnings.
- **UI/UX Overhaul & Real-Time Visualization Validation**:
  - Browser subagent validation verified the enterprise UI redesign:
    1. Recharts bar charts, donut charts, and horizontal category distributions rendering live with normalized keys.
    2. Dual-mode Grid & Kanban board with real-time column grouping (`Open`, `In Progress`, `Waiting for Student`, `Resolved`).
    3. Global Command Palette (`Ctrl + K`) for instant search and persona switching.
    4. Interactive 5-stage Ticket Lifecycle Stepper on the ticket detail page.
    5. Zero-dependency Toast notification provider rendering animated status alerts.
