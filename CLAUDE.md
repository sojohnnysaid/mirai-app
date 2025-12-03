Here is the updated **System/Agent Ruleset** for Mirai.

These rules explicitly **replace** your old Redux instructions. Copy this into your `.cursorrules`, custom GPT instructions, or agent context. It aligns strictly with the **Proto-First** and **Connect-Query** architecture we established.

---

### 🛡️ Mirai Architecture & State Rules

**Core Principle:** The Protobuf contracts (`.proto`) are the single source of truth. The Frontend is a projection of Server State (Connect-Query) + Flow Logic (XState) + UI State (Zustand). **Redux is strictly forbidden.**

#### 1. Proto-First Development
*   **Contract is King:** Before writing Frontend code, check `/proto`. If a data field or method does not exist in the `.proto` definitions, **do not** implement it in the UI. Request a schema change first.
*   **Generated Clients:** NEVER write manual `fetch` or `axios` calls. ALWAYS use the generated Connect-Query hooks (`useQuery(service.method)`, `useMutation(service.method)`).
*   **Type Safety:** Use generated TypeScript types (`_pb.ts`) for all domain objects. Do not create manual interfaces (e.g., `interface User`) that mirror Proto messages. Use `import type { User } from '@/gen/mirai/v1/common_pb'`.

#### 2. State Management Taxonomy
Stop using Redux. Distribute state according to this matrix:

| State Type | Logic Location | Implementation Tool |
| :--- | :--- | :--- |
| **Server Data** | DB / Backend | **Connect-Query** (`@connectrpc/connect-query`). Direct hooks in components. |
| **Complex Flows** | Logic / Validation | **XState** (Registration, Course Builder, Wizards). |
| **Global UI** | Toggles / Themes | **Zustand** (Sidebar, Modals). Keep it atomic and tiny. |
| **Auth** | Session Status | **Connect-Query** (`whoAmI` endpoint). |

#### 3. State Machine Guidelines (XState)
*   **Isolate Side Effects:** State machines must be pure logic. Use `invoke` or `services` to call Connect-RPC mutations. Never mutate UI or DOM directly from the machine.
*   **Event-Driven Transitions:** Use semantic events (`CHECKOUT_COMPLETED`, `AI_GENERATION_FAILED`) rather than setting boolean flags.
*   **Explicit Error States:** Every network/logic failure must transition to a dedicated failure state (e.g., `failure.payment_declined`, `failure.network_error`) with explicit retry transitions.
*   **Telemetry:** Emit analytics events (e.g., `track('FLOW_STARTED')`) on state entry/exit, not within React components.
*   **Decoupled Context:** Pass server data (from Connect-Query) into the Machine via Context/Props. Do not fetch data *inside* the machine unless it is a dependent step of the flow.

#### 4. Backend & Worker Patterns
*   **Async Processing:** Never use `go routines` or `time.Ticker` for critical jobs. Use the **Asynq** client wrapper (`worker.Client`).
*   **Race Conditions:** Assume 3+ replicas are running. All scheduled tasks must go through Asynq/Redis to ensure "exactly-once" execution.
*   **Storage Access:**
    *   **Metadata:** Read/Write to Postgres (via Go structs).
    *   **Large Content (Video/PDF):** Use **Presigned URLs**. Never stream bytes through the Backend pod; client uploads directly to NAS/MinIO.

#### 5. Code Style & Safety
*   **Strict Return Values:** RPC handlers must return `connect.NewError()` for failures, using standard gRPC codes (`CodeNotFound`, `CodePermissionDenied`).
*   **No "Any":** TypeScript `any` is forbidden.
*   **Environment:** Reference `process.env` (Node) or `import.meta.env` (Vite/Next) only through a centralized config helper, never raw in components.

---

### Example: "How to add a feature" (Agent Workflow)

1.  **Check Proto:** Does `CreateCourse` exist in `course.proto`?
2.  **Generate:** Run `buf generate`.
3.  **Frontend:**
    *   Import `createCourse` from `gen/.../course_connect`.
    *   Use `useMutation(createCourse)` in the component.
    *   On success, call `queryClient.invalidateQueries({ queryKey: [listCourses] })`.
4.  **Backend:**
    *   Implement `CreateCourse` handler in `internal/application/service`.
    *   If heavy work is needed, enqueue an `Asynq` task.



---

# CLAUDE.md – Frontend State Architecture

## Overview

The application uses a **three-layer state model**. Each layer has a precise responsibility and must not bleed into the others.

---

## 1. XState – *Authoritative Source for Wizard + Flow Logic*

XState machines control **all multi-step flows** and **all form data** inside those flows.

### XState holds:

* `courseId`, `title`, `desiredOutcome`
* `selectedSmeIds`
* `selectedAudienceIds`
* `outlineJobId`, `lessonJobId`
* `error`
* **all generation states**
* **wizard current step**

### XState defines:

* step transitions
* branching logic
* async state progress (`generatingOutline`, `generatingLessons`)
* transitions into editor and preview

### Rules:

* **No wizard state stored in Zustand.**
* **No server caching or persistence logic in XState.**
* **Components read wizard state only via `useMachine()`**.

---

## 2. Connect-Query – *Server State & Persistence*

Connect-Query is the single interface for all persisted state defined in protobuf RPCs.

### Connect-Query handles:

* fetching course data
* mutations (create/update/delete)
* caching, deduplication
* invalidation after mutations
* optimistic updates if needed

### Rules:

* **Treat Connect-Query as the “database cache”, not a global store.**
* **Do not mirror server state in Zustand.**
* **Do not store wizard steps or editor UI flags here.**

---

## 3. Zustand – *Ephemeral UI State Only*

Zustand manages lightweight UI-only concerns that never come from the server and are not part of a flow.

### Zustand holds:

* `activeBlockId` (block selected in the editor)
* `isDirty`
* `isSaving`
* sidebar visibility
* modal open/close
* transient editor UI state

### Rules:

* **No persisted data here.**
* **No multi-step flow logic here.**
* **No wizard “current step” here.**
* **No protobuf-shaped state here.**

---

## 4. Role Separation Summary

| Layer             | Purpose                                              |
| ----------------- | ---------------------------------------------------- |
| **XState**        | Wizard flow, step logic, form data, generation flow  |
| **Connect-Query** | Server state fetched/persisted via protobuf RPCs     |
| **Zustand**       | Local UI state (selection, toggles, ephemeral flags) |

---

## 5. Editor Constraints

The course editor store must remain minimal:

### Allowed:

* `activeBlockId`
* `isDirty`
* `isSaving`

### Not allowed:

* wizard steps
* course metadata
* SME lists
* audience lists
* generation job IDs
* any data already inside XState or Connect-Query

---

## Enforcement

When adding new features:

1. **Is it persisted server data?**
   → Connect-Query
2. **Is it part of a multi-step flow or async UI workflow?**
   → XState
3. **Is it a pure UI concern (selection, visibility, small UX flags)?**
   → Zustand

Anything that does not fit these categories must be reconsidered.

---
- ### Background Job & Concurrency Rules

**Context:** Mirai runs in a High-Availability Kubernetes cluster with 3+ replicas.
**Core Principle:** NEVER use in-memory concurrency (`go func`, `sync.WaitGroup`, `time.Ticker`) for business logic or scheduled tasks.

#### 1. The Tool: Asynq (Redis)
All background work must be routed through `github.com/hibiken/asynq`.
- **Queue:** Redis (Namespace: `redis`).
- **Persistence:** Jobs persist even if pods restart.

#### 2. Pattern: Producer/Consumer
When implementing a long-running task (e.g., AI Generation, Emailing, Third-party Sync):
1.  **Define Payload:** Create a JSON-serializable struct in `internal/domain/worker/tasks.go`.
2.  **Producer:** In the Service or Handler, use `worker.Client` to enqueue the task.
    - *Constraint:* Pass IDs, not full objects. Fetch fresh data in the worker.
3.  **Consumer:** Implement the handler in `internal/infrastructure/worker/handlers.go`.

#### 3. Scheduled Tasks (Cron Replacement)
**NEVER** use `time.Ticker` or `cron` libraries inside `main.go`.
- *Reason:* With 3 replicas, a `Ticker` will run the job 3 times simultaneously (Race Condition).
- *Solution:* Register the task in the Asynq **Scheduler** (`internal/infrastructure/worker/server.go`). Asynq guarantees only one instance runs the schedule.

#### 4. Error Handling & Retries
- **Transient Errors (Network/DB):** Return a non-nil `error`. Asynq will automatically retry with exponential backoff.
- **Fatal Errors (Bad Data):** Return `asynq.SkipRetry` or log error and return `nil` to stop the retry loop.

#### 5. Idempotency is Mandatory
Assume every task handler might run twice for the same payload.
- *Check:* Query the DB state at the start of the handler.
- *Act:* Perform the operation.
- *Save:* Update the DB state immediately.