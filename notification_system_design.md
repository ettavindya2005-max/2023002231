# Notification System Design

---

## Stage 1 — REST API Design & Contract

To support a seamless, reliable, and responsive notification platform for logged-in students, we need to design REST APIs that are predictable, standardized, and highly performant. Below is the proposed REST API contract.

### Core Actions to Support
1. **Fetch Notifications**: Retrieve a paginated, filterable list of notifications for the logged-in student.
2. **Mark as Read**: Mark one or more notifications as read to distinguish between new and viewed alerts.
3. **Delete/Archive**: Dismiss a notification so it no longer appears in the active feed.

---

### API Specifications

#### 1. Fetch Student Notifications
* **Endpoint**: `GET /api/v1/notifications`
* **Headers**:
  * `Authorization`: `Bearer <JWT_ACCESS_TOKEN>` (contains encrypted Student ID, role, and metadata)
  * `Accept`: `application/json`
* **Query Parameters**:
  * `limit` (Integer, Optional): Number of notifications to fetch. Range: `5` to `50` (default: `10`).
  * `page` (Integer, Optional): Current page number for offset-based retrieval (default: `1`).
  * `notification_type` (String, Optional): Filter by category. Allowed values: `Placement`, `Result`, `Event`.
  * `is_read` (Boolean, Optional): Filter by read status (`true` or `false`).
* **Success Response (Status: 200 OK)**:
```json
{
  "notifications": [
    {
      "id": "d146095a-0d86-4a34-9e69-3900a14576bc",
      "type": "Result",
      "message": "mid-sem results published",
      "timestamp": "2026-04-22 17:51:30",
      "is_read": false
    },
    {
      "id": "b283218f-ea5a-4b7c-93a9-1f2f240d64b0",
      "type": "Placement",
      "message": "CSX Corporation hiring drive active",
      "timestamp": "2026-04-22 17:51:18",
      "is_read": true
    }
  ],
  "pagination": {
    "total_records": 128,
    "limit": 10,
    "current_page": 1,
    "total_pages": 13,
    "has_next": true,
    "has_prev": false
  }
}
```
* **Error Response (Status: 400 Bad Request)**:
```json
{
  "errors": [
    {
      "field": "limit",
      "message": "limit must be between 5 and 50"
    }
  ]
}
```

#### 2. Bulk Mark Notifications as Read
* **Endpoint**: `PATCH /api/v1/notifications/read`
* **Headers**:
  * `Authorization`: `Bearer <JWT_ACCESS_TOKEN>`
  * `Content-Type`: `application/json`
* **Request Body**:
```json
{
  "notification_ids": [
    "d146095a-0d86-4a34-9e69-3900a14576bc"
  ]
}
```
* **Success Response (Status: 200 OK)**:
```json
{
  "success": true,
  "message": "1 notification(s) successfully marked as read"
}
```

#### 3. Dismiss/Delete Notification
* **Endpoint**: `DELETE /api/v1/notifications/:id`
* **Headers**:
  * `Authorization`: `Bearer <JWT_ACCESS_TOKEN>`
* **Success Response (Status: 204 No Content)**:
*(No response body)*

---

### Real-Time Notification Delivery Mechanism

For real-time delivery of notifications while a user is active in the app, I suggest using **Server-Sent Events (SSE)**.

#### Why Server-Sent Events (SSE)?
1. **Lightweight & HTTP Native**: Unlike WebSockets which require a separate custom protocol and handshake, SSE runs over standard HTTP/1.1 or HTTP/2. This makes it firewall-friendly and simple to route through standard API gateways.
2. **Built-in Auto-Reconnection**: The browser client automatically handles reconnections if the connection drops, sending the last received event ID (`Last-Event-ID` header) so the server can push missed messages.
3. **One-Way Server push**: Notifications are strictly server-to-client updates. WebSockets are bidirectional, which introduces unnecessary overhead (and potential socket leaks) when the client doesn't need to push data back over the socket.
4. **Multiplexing over HTTP/2**: When using HTTP/2, a single TCP connection is shared, bypassing the browser's 6-connection limit for SSE.

#### Real-time flow:
1. Client establishes connection: `GET /api/v1/notifications/stream` (headers: `Accept: text/event-stream`).
2. The server keeps this connection open.
3. When a new placement/result/event is published, the backend writes to a Redis Pub/Sub channel.
4. The API stream handler receives the Redis event and pushes it to the client as an SSE event block:
```text
event: notification
data: {"id": "uuid-123", "type": "Placement", "message": "Tesla is hiring!", "timestamp": "2026-06-07 11:20:00"}
```

---

## Stage 2 — Database Selection & Schema Design

### Chosen Persistent Storage: PostgreSQL (Relational Database)

I recommend **PostgreSQL** for storing notification data.

#### Rationale:
* **Relational Integrity**: Notifications are strictly tied to students. Foreign key constraints ensure we don't end up with orphan notification records.
* **Structured but Flexible**: The core fields (`id`, `student_id`, `type`, `message`, `is_read`, `created_at`) are highly structured. If we need to attach arbitrary metadata later (e.g., job descriptions, interview links), PostgreSQL handles this elegantly via a `JSONB` column.
* **Complex Queries & Indexing**: PostgreSQL excels at composite indexing and range scans (like fetching placement notifications over a specific date range), which is crucial for our priority inbox and status updates.
* **Scalability features**: PostgreSQL easily handles millions of rows using B-Tree/GIN indexes, table partitioning, and read replicas.

---

### Database Schema

```sql
-- Enums for notification types
CREATE TYPE notification_type_enum AS ENUM ('Placement', 'Result', 'Event');

-- Students Table (For relation)
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type notification_type_enum NOT NULL,
    message VARCHAR(255) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance (detailed in Stage 3)
CREATE INDEX idx_notifications_student_unread ON notifications (student_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_type_created ON notifications (type, created_at DESC);
```

---

### Scaling Issues & Mitigation Strategies

At 50,000 students and 5,000,000 notifications (growing daily), several problems will arise:

1. **Index Bloat and Memory pressure**: As indexes grow, they exceed RAM size, causing database pages to swap from disk, dramatically slowing down reads.
   * *Solution*: **Table Partitioning by Range**. Partition the `notifications` table by `created_at` monthly (e.g., `notifications_2026_05`, `notifications_2026_06`). The database only scans the partition corresponding to the query time range, keeping active indexes tiny and hot in RAM.
2. **Write Saturation**: During campus recruitment, hundreds of notifications are sent in bulk, overloading the write capacity of the primary database.
   * *Solution*: **Bulk inserts & Queuing**. Instead of firing individual SQL statements, batch the inserts (e.g., insert 1000 records at a time) and buffer writes using a message queue (RabbitMQ/Kafka) to rate-limit DB writes.
3. **Data Retention**: Keeping all historical notifications forever is unnecessary.
   * *Solution*: **TTL / Data Retention Policy**. Schedule an offline worker to move notifications older than 6 months into a cold store (like compressed archive tables or S3) and drop the partitions from the hot database.

---

### SQL Queries (Stage 1 Mapping)

#### 1. Retrieve Unread Notifications for Student (Paginated)
```sql
SELECT id, type, message, is_read, created_at
FROM notifications
WHERE student_id = 1042 AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 10 OFFSET 0;
```

#### 2. Mark Selected Notifications as Read
```sql
UPDATE notifications
SET is_read = TRUE, updated_at = NOW()
WHERE student_id = 1042 AND id = ANY('{d146095a-0d86-4a34-9e69-3900a14576bc}'::uuid[]);
```

---

## Stage 3 — Query Optimization & Indexing

### The Slow Query
```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

**Is this query accurate?**
Functionally, yes — it correctly retrieves unread notifications for a specific student sorted by time. However, using `SELECT *` is bad practice at scale because it retrieves unnecessary data and prevents database optimization.

**Why is it slow?**
At 5,000,000 rows, without appropriate indexing, the database performs a **Full Table Scan** (checking all 5 million rows to see if they belong to student 1042) followed by a **Filesort** (sorting the matches in memory or on temporary disk space).

**Proposed changes & Indexing Strategy**:
I recommend creating a composite index:
```sql
CREATE INDEX idx_student_unread_time ON notifications (studentID, isRead, createdAt);
```
* **Why this index?**:
  1. The database performs an index seek to immediately find records matching `studentID = 1042`.
  2. Inside that subset, it filters out records where `isRead = false`.
  3. Since `createdAt` is the third column, the records are already sorted on disk in that order. The database reads them sequentially without executing a memory-heavy filesort.

I would rewrite the query to avoid `SELECT *`:
```sql
SELECT id, type, message, createdAt
FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```
* **Cost Comparison**:
  * *Without Index*: $O(N)$ lookup where $N = 5,000,000$, plus $O(M \log M)$ sorting cost where $M$ is the number of matching records.
  * *With Composite Index*: $O(\log N)$ index lookup plus $O(K)$ sequential scan where $K$ is the number of results returned.

**Should we add indexes on every column?**
No, this is highly counterproductive:
1. **Write Overhead**: Every time a notification is created, read, or deleted, the database has to update *every single index*. This slows down writes significantly.
2. **Storage Waste**: Indexes take up considerable RAM and disk space.
3. **Optimizer Confusion**: Too many indexes can confuse the database query planner, sometimes causing it to select sub-optimal indexes.

---

### Placement Notifications in Last 7 Days
```sql
SELECT DISTINCT studentID
FROM notifications
WHERE notificationType = 'Placement'
  AND createdAt >= NOW() - INTERVAL 7 DAY;
```
To optimize this range-query:
```sql
CREATE INDEX idx_type_created ON notifications (notificationType, createdAt);
```
This allows the query planner to seek directly to the 'Placement' type and scan only the date range for the last 7 days.

---

## Stage 4 — Improving Performance on Repeated Fetches

When 50,000 students reload their pages constantly, querying the DB every time saturates database connections.

### Solutions & Tradeoffs

#### 1. In-Memory Caching (Redis)
Store a student's unread notifications in Redis with a Time-To-Live (TTL) of 30-60 seconds.
* *Tradeoffs*:
  * **Pros**: Sub-millisecond response time; completely shields the SQL database from repeated read hits.
  * **Cons**: Short stale-data window (up to 60s); cache invalidation complexity when a notification is marked read.

#### 2. Server-Sent Events (SSE) or WebSockets
Instead of clients polling, push new notifications in real-time.
* *Tradeoffs*:
  * **Pros**: Real-time delivery; reduces database read queries to exactly one load upon initial connection.
  * **Cons**: High persistent connection overhead; requires sticky-session routing if load-balanced.

#### 3. Database Read Replicas
Deploy replica nodes and route all SELECT queries to them, leaving the master database dedicated to writes.
* *Tradeoffs*:
  * **Pros**: Simple architectural change; isolates read traffic.
  * **Cons**: Slight replication lag; increased cloud infrastructure costs.

---

## Stage 5 — Bulk Notification Reliability

### Shortcomings of Current Implementation
```javascript
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message)   # calls Email API
        save_to_db(student_id, message)   # DB insert
        push_to_app(student_id, message)  # real-time push
```
1. **Synchronous Execution Delay**: Firing an API request to `send_email` sequentially for 50,000 students will take hours. If a single email call takes 150ms, processing all students takes 7,500 seconds (over 2 hours).
2. **Fatal Interruptions**: If student #201 causes an API error, the function terminates. Students 202-50,000 are left completely unnotified.
3. **No Retries**: The 200 failed emails are lost. There is no tracking of failed attempts or dead-letter queues.
4. **Synchronous DB Inserts**: Executing 50,000 single INSERT statements creates massive database transaction lock overhead.

---

### Redesigned Architecture (Decoupled, Reliable, Batch-Processed)

The DB write and email sending should be completely decoupled. The database write represents the system's state of record and must be guaranteed first, while email/push notifications are best-effort asynchronous operations.

```javascript
// Decoupled Publisher
async function notify_all(student_ids, message) {
  // 1. Bulk insert in chunks of 1000 to minimize DB transaction overhead
  const chunks = chunkArray(student_ids, 1000);
  for (const batch of chunks) {
    try {
      await db.bulkInsertNotifications(batch, message);
    } catch (dbError) {
      logger.error("DB bulk insert failed for batch", dbError);
      // Push failing batch to a recovery queue
      await recoveryQueue.publish("db_recovery", { batch, message });
    }
  }

  // 2. Queue notifications for asynchronous processing
  for (const student_id of student_ids) {
    await queue.publish("email_jobs", { student_id, message, retryCount: 0 });
    await queue.publish("push_jobs", { student_id, message });
  }
}

// Asynchronous Email Worker
async function emailWorkerConsumer(job) {
  try {
    await send_email(job.student_id, job.message);
  } catch (apiError) {
    if (job.retryCount < 3) {
      job.retryCount++;
      // Re-queue with exponential backoff delay (e.g. 5m, 15m, 45m)
      await queue.publishDelayed("email_jobs", job, Math.pow(3, job.retryCount) * 60);
    } else {
      // Exceeded retries, dump into Dead Letter Queue for investigation
      await deadLetterQueue.publish("email_dlq", { ...job, error: apiError.message });
    }
  }
}
```

---

## Stage 6 — Priority Inbox

### Priority Scoring & Comparison Rules
To rank unread notifications, we compute priority using a combination of **weight** and **recency**:
* **Type Weight**: `Placement` (weight = 3) > `Result` (weight = 2) > `Event` (weight = 1).
* **Recency**: Within the same weight, newer timestamps rank higher.

### High-Efficiency Maintenance via Min-Heap
To maintain the top $N$ notifications efficiently without re-sorting the whole list:
1. Initialize a **Min-Heap** of capacity $N$.
2. For each incoming notification, evaluate its priority relative to the heap's root (which holds the current *lowest* priority item in the top $N$).
3. If the new item has a higher priority than the root, pop the root and push the new item.
4. This keeps memory usage capped at $O(N)$ and time complexity at $O(K \log N)$ (where $K$ is total notifications), which is significantly faster than sorting all items $O(K \log K)$ at scale.

*A fully functional implementation is provided in `priority_inbox/priority_inbox.js`.*
