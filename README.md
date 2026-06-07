# CampusPulse — Full-Stack Notification Platform

Welcome to the repository for the CampusPulse campus-wide notification platform evaluation. This application displays real-time placements, events, and academic results for students in a responsive and performant dashboard.

---

## 🎥 Project Demo Videos
*   **Demo**: https://drive.google.com/file/d/1SYnO9tQY32C9BfXe41zRg0YFN8Msj5z7/view?usp=drivesdkgit add README.md

---

## 📂 Project Structure

```text
├── notification_system_design.md   # Written responses for Stages 1 to 6
├── priority_inbox/                  # Stage 6: Min-Heap CLI prioritizer
│   ├── priority_inbox.js
│   └── package.json
├── notification_app_fe/             # Stage 7: Responsive React + MUI dashboard (Port 3000)
│   ├── src/
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── logging_middleware/              # Logger utility for event tracking
├── screenshots/                     # Output mockups and CLI table logs
└── README.md                        # Project guide
```

---

## 🚀 Getting Started

### 1. Run the Priority Inbox CLI (Stage 6)
To run the priority inbox script which fetches notifications, applies the Min-Heap sorting logic, and logs output:

```bash
# Navigate to priority inbox
cd priority_inbox

# Run the script
node priority_inbox.js
```

---

### 2. Run the React Web Dashboard (Stage 7)
The React application runs on Vite and is styled with Material UI. It runs exclusively on `http://localhost:3000`.

```bash
# Navigate to the frontend directory
cd notification_app_fe

# Install dependencies (if not already done)
npm install

# Start the dev server
npx vite
```
Once started, open your browser and navigate to: **`http://localhost:3000/`**

---

## 🛠️ Verification Done
*   **Design Specifications**: Full implementation of REST API contract, DB schema partitioning models, indexing math, performance tuning (caching/replicas), bulk queue recovery architecture, and heap sort logic.
*   **Error Handling**: Embedded a safe JWT decoder inside the frontend to resolve base64url padding exceptions in browser-native `atob`.
*   **CORS Bypass**: Integrated a development proxy in Vite to route relative requests to `/evaluation-service/...` locally, bypassing server-side double headers.
