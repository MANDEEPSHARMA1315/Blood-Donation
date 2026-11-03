# 🩸 Blood Donation Camp Coordination System (BloodLink)

A full-stack web application designed for blood banks, hospitals, NGOs, donors, and volunteers to organize, manage, and coordinate blood donation camps efficiently.

---

## 🌟 Overview & Highlights

The **Blood Donation Camp Coordination System** manages the entire lifecycle of blood donation drives:
- **Donation Camp Management**: Creation, scheduling, slot interval configuration, capacity ceiling enforcement, and cancellations.
- **Atomic Slot Booking & Conflict Prevention**: Real-time slot availability, backend-enforced capacity limits, prevention of duplicate reservations on the same camp.
- **Multi-Role Dashboards**: Tailored consoles and workflows for **Admin**, **Donor**, **Camp Coordinator**, and **Volunteer**.
- **Live Camp Operations Control Desk**: On-site donor check-in, medical vitals logging, unique blood bag barcode assignment, and phlebotomy verification.
- **Operational Readiness & Supply Checklist**: Real-time inspection checklist for biohazard waste disposal, emergency oxygen cylinders, phlebotomy beds, and cold-chain coolers.
- **Volunteer Shift Management**: Role-based shift assignments, duty responsibilities, check-in/out hours logging.
- **Reporting & Analytics**: Interactive Recharts visualizations (Monthly trends, blood group distribution, camp capacity utilization), CSV export, and printable camp attendance muster rolls.
- **Medical Eligibility & Privacy Compliance**: Explicit medical disclaimers (actual donor eligibility is determined on-site by qualified medical officers), consent-based donor registry controls, and audit trails.
- **Zero-Friction Zero-Config Database**: Seamless fallback to an embedded in-memory MongoDB with pre-loaded demo data if local MongoDB is not running, while also natively supporting standard MongoDB Atlas / local MongoDB connections.

---

## 🏗️ Architecture & Technology Stack

```
                          ┌────────────────────────┐
                          │   React 18 + Vite      │
                          │   Tailwind CSS         │
                          │   Recharts Charts      │
                          │   Lucide React Icons   │
                          └───────────┬────────────┘
                                      │ HTTP / REST API (Axios)
                                      ▼
                          ┌────────────────────────┐
                          │   Node.js + Express    │
                          │   JWT Authentication   │
                          │   Role-Based Guards    │
                          │   Atomic Capacities    │
                          └───────────┬────────────┘
                                      │ Mongoose ODM
                                      ▼
                          ┌────────────────────────┐
                          │      MongoDB           │
                          │ (Atlas / Local /       │
                          │  Embedded In-Memory)   │
                          └────────────────────────┘
```

### Technology Matrix
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React, Recharts, Axios, React Router v6.
- **Backend**: Node.js, Express.js, Mongoose ODM, JWT (`jsonwebtoken`), bcryptjs, Morgan.
- **Database**: MongoDB with automatic fallback to embedded in-memory database (`mongodb-memory-server`) for instantaneous out-of-the-box local execution.
- **Testing**: Built-in Node test runner (`node:test`) + Supertest for capacity enforcement, slot concurrency, and role permission tests.

---

## 👥 User Roles & Permissions

| Role | Access Level | Primary Features & Responsibilities |
|---|---|---|
| **Admin** | Full System Access | Manage all users, assign user roles, create & cancel camps, system-wide analytics, view transaction audit logs, CSV exports. |
| **Donor** | Donor Self-Service | Browse upcoming camps, book/reschedule/cancel appointment slots, view appointment pass, donation history, and manage privacy consent. |
| **Camp Coordinator** | Camp Operations Desk | On-site desk check-in, record donations with vitals & bag barcodes, readiness & supply checklists, generate printable muster sheets. |
| **Volunteer** | Camp Support | View assigned camp shifts, accept or decline shifts, view duty responsibilities, check-in and check-out to log volunteer service hours. |

---

## 🔑 Demo Login Accounts

Use the **Quick Demo Switcher** bar at the top of the interface for 1-click instant login as any role, or use these credentials:

| Role | Email | Password |
|---|---|---|
| 👑 **Admin** | `admin@blooddonation.org` | `Password123!` |
| 🏥 **Camp Coordinator** | `coordinator@blooddonation.org` | `Password123!` |
| 🤝 **Volunteer** | `volunteer@blooddonation.org` | `Password123!` |
| 🩸 **Donor** | `donor@blooddonation.org` | `Password123!` |

---

## 🗄️ Database Schemas & Relationships

1. **User**: Name, email, hashed password, role (`admin`, `donor`, `volunteer`, `coordinator`), phone, avatar, `isActive`.
2. **DonorProfile**: `user` (ref: User), `bloodGroup` (A+, A-, B+, B-, AB+, AB-, O+, O-), date of birth, emergency contact, consent toggles (`consentToStoreData`, `consentToContact`), total donations count, next eligible date.
3. **Camp**: Name, organizer, venue, address, city, state, pincode, coordinates, date, startTime, endTime, capacity, slotDurationMinutes, maxPerSlot, bookedCount, checkedInCount, completedDonationsCount, status (`draft`, `upcoming`, `open`, `full`, `completed`, `cancelled`), coordinators.
4. **Appointment**: `camp` (ref: Camp), `donor` (ref: User), `donorProfile`, slotStartTime, slotEndTime, unique `appointmentNumber` (e.g. `BDC-2026-10021`), status (`confirmed`, `pending`, `checked_in`, `completed`, `cancelled`, `no_show`), notes, medical check notes.
5. **VolunteerAssignment**: `camp`, `volunteer` (ref: User), shiftStartTime, shiftEndTime, roleTitle, responsibilities array, status (`assigned`, `confirmed`, `attended`, `absent`, `declined`), hoursLogged.
6. **CampTask**: `camp`, title, category (`readiness`, `equipment_supply`, `logistics`, `safety`), isCompleted, completedAt, completedBy, priority (`low`, `medium`, `high`, `urgent`), quantity.
7. **DonationRecord**: `camp`, `appointment`, `donor`, `bloodGroup`, `unitsCollected`, volumeMl, hemoglobinLevel, bloodPressure, pulseRate, weightKg, phlebotomistName, verifiedBy, donationStatus (`successful`, `deferred`), deferralReason, unique `bagNumber` (e.g. `BAG-2026-55421`).
8. **Notification**: `recipient` (ref: User), title, message, type (`booking`, `cancellation`, `shift`, `camp_update`), isRead.
9. **AuditLog**: `user`, action, entityType, entityId, details, ipAddress, timestamp.

---

## 📁 Project Folder Structure

```
Blood Donation/
├── client/                          # React + Vite Frontend
│   ├── index.html                   # HTML entry point with fonts & metadata
│   ├── package.json                 # Frontend dependencies
│   ├── vite.config.js               # Vite config with /api proxy
│   ├── tailwind.config.js           # Tailwind CSS configuration with crimson theme
│   ├── postcss.config.js            # PostCSS config
│   └── src/
│       ├── api/
│       │   └── client.js            # Axios client with JWT interceptor
│       ├── components/
│       │   ├── CampCard.jsx         # Camp card with capacity bar & badges
│       │   ├── DemoAccountsBar.jsx  # 1-click quick demo evaluation bar
│       │   ├── DisclaimerBanner.jsx # Medical eligibility notice banner
│       │   ├── Navbar.jsx           # Responsive navigation & profile menu
│       │   ├── NotificationsPopover.jsx # In-app notification dropdown
│       │   ├── PrintableAttendanceModal.jsx # Official printable muster sheet
│       │   ├── SlotSelector.jsx     # Interactive arrival slot selector
│       │   └── StatusBadge.jsx      # Color-coded status badges
│       ├── context/
│       │   ├── AuthContext.jsx      # Auth state, login, register, 1-click switch
│       │   └── NotificationContext.jsx # Real-time polling & notification state
│       ├── pages/
│       │   ├── AnalyticsPage.jsx    # Recharts metrics, trends, & CSV export
│       │   ├── CampDetailPage.jsx   # Camp overview, slot picker, booking flow
│       │   ├── CampOperationsPage.jsx # Desk check-in, donation logging, checklists
│       │   ├── CampsPage.jsx        # Camp listing, search, filters, calendar view
│       │   ├── DashboardPage.jsx    # Tailored multi-role dashboards
│       │   ├── LoginPage.jsx        # Login with quick credential cards
│       │   ├── MyAppointmentsPage.jsx # Donor booking tickets & rescheduling
│       │   ├── ProfilePage.jsx      # Donor profile, blood group, consent settings
│       │   ├── RegisterPage.jsx     # Multi-role registration with consent
│       │   ├── UserManagementPage.jsx # Admin user directory & audit trail
│       │   └── VolunteerShiftsPage.jsx# Volunteer shifts & duty hours logging
│       ├── App.jsx                  # Route definitions & protected route guards
│       ├── main.jsx                 # React root render
│       └── index.css                # Tailwind directives & print media styles
├── server/                          # Node.js + Express Backend
│   ├── package.json                 # Backend dependencies & test scripts
│   ├── .env.example                 # Environment variables template
│   ├── .env                         # Local environment configuration
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Mongoose connection with embedded fallback
│   │   │   └── seed.js              # Comprehensive fictional demo data seeder
│   │   ├── controllers/
│   │   │   ├── appointmentController.js # Atomic slot reservations & cancels
│   │   │   ├── authController.js    # Register, login, me, profile
│   │   │   ├── campController.js    # CRUD camps, slot calculation, cascade cancels
│   │   │   ├── campOpsController.js # Check-in, vitals logging, checklist tasks
│   │   │   ├── notificationController.js # In-app notifications
│   │   │   ├── reportController.js  # Analytics aggregation & CSV exports
│   │   │   ├── userController.js    # User management & audit logs
│   │   │   └── volunteerController.js # Volunteer shift assignments & hours
│   │   ├── middleware/
│   │   │   ├── auth.js              # JWT verification & role authorization
│   │   │   └── errorHandler.js      # Global error and validation handler
│   │   ├── models/                  # 9 Mongoose schemas
│   │   ├── routes/                  # Express REST route modules
│   │   ├── utils/                   # JWT & audit logger utilities
│   │   ├── app.js                   # Express application setup
│   │   └── server.js                # Server entry point & graceful shutdown
│   └── tests/
│       ├── bookingCapacity.test.js  # Atomic capacity & slot limit tests
│       ├── conflicts.test.js        # Double booking & cancellation tests
│       └── permissions.test.js      # Role authorization & security tests
├── package.json                     # Root orchestrator scripts
└── README.md                        # Documentation & setup guide
```

---

## 🚀 Setup Instructions (Windows)

### Prerequisites
- **Node.js**: v18.0.0 or higher (v24.x tested and confirmed)
- **NPM**: v9.0.0 or higher
- *(Optional)* **MongoDB**: If you have a local MongoDB instance running on port 27017 or a MongoDB Atlas URI, specify it in `server/.env`. If not, the application **automatically starts an embedded in-memory MongoDB** and pre-seeds it so you can test immediately with zero configuration!

### Step 1: Install Dependencies
Open PowerShell or Command Prompt in the project root:
```powershell
# Install root, server, and client packages
npm run install:all
```
*(Or install separately:)*
```powershell
cd server
npm install
cd ../client
npm install
cd ..
```

### Step 2: Configure Environment Variables
Verify or adjust `server/.env`:
```ini
PORT=5000
NODE_ENV=development
# MONGODB_URI=mongodb://127.0.0.1:27017/blood_donation_db
# Leave MONGODB_URI blank to auto-use embedded zero-config database
MONGODB_URI=
JWT_SECRET=super_secret_blood_donation_jwt_key_2026_xyz987
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### Step 3: Run Seed Script (Optional if using external MongoDB)
If connecting to an external MongoDB instance:
```powershell
npm run seed
```

### Step 4: Run the Application
Start the backend server and frontend development server in two separate terminals, or use npm scripts:

**Terminal 1 (Backend):**
```powershell
npm run server
```
*Backend runs on: `http://localhost:5000`*

**Terminal 2 (Frontend):**
```powershell
npm run client
```
*Frontend runs on: `http://localhost:5173`*

Open `http://localhost:5173` in your web browser.

---

## 🧪 Automated Testing

Run the automated test suite testing booking capacity, appointment conflicts, and role permissions:

```powershell
cd server
npm test
```

### Test Suite Execution Output
```
> blood-donation-server@1.0.0 test
> node --test tests/*.test.js

✔ POST /api/appointments successfully books when slots and capacity are available
✔ POST /api/appointments rejects booking when specific time slot maxPerSlot is exceeded
✔ POST /api/appointments rejects booking when overall camp capacity is reached
✔ Prevents duplicate/double booking for the same donor in the same camp
✔ Allows cancelling appointment and updates camp bookedCount
✔ Unauthenticated request to protected route returns 401
✔ Donor role cannot create a camp (returns 403 Forbidden)
✔ Admin role can successfully create a camp (returns 201 Created)
✔ Donor role cannot perform desk check-in on an appointment (returns 403 Forbidden)
✔ Coordinator role can check in a donor (returns 200 OK)

ℹ tests 10
ℹ pass 10
ℹ fail 0
```

---

## 📡 API Testing Examples

### 1. Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health"
```
*Response:*
```json
{
  "status": "healthy",
  "system": "Blood Donation Camp Coordination System",
  "timestamp": "2026-10-26T12:05:21.290Z",
  "uptime": 85.69
}
```

### 2. User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"donor@blooddonation.org","password":"Password123!"}'
```

### 3. List Upcoming Camps with Filters
```bash
curl "http://localhost:5000/api/camps?status=upcoming&city=New%20Delhi"
```

### 4. Book an Appointment Slot
```bash
curl -X POST http://localhost:5000/api/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "campId": "<CAMP_ID>",
    "slotStartTime": "10:00",
    "slotEndTime": "10:30",
    "notes": "First-time donor"
  }'
```

### 5. Check-In Registered Donor (Coordinator / Admin)
```bash
curl -X PUT http://localhost:5000/api/camp-ops/appointments/<APPOINTMENT_ID>/check-in \
  -H "Authorization: Bearer <COORDINATOR_JWT_TOKEN>"
```

### 6. Record Completed Blood Donation
```bash
curl -X POST http://localhost:5000/api/camp-ops/donations \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <COORDINATOR_JWT_TOKEN>" \
  -d '{
    "appointmentId": "<APPOINTMENT_ID>",
    "bloodGroup": "O+",
    "unitsCollected": 1,
    "hemoglobinLevel": 13.8,
    "bloodPressure": "120/80",
    "pulseRate": 72,
    "weightKg": 65,
    "phlebotomistName": "Dr. Sharma",
    "donationStatus": "successful"
  }'
```

### 7. Export Donations CSV
```bash
curl -O http://localhost:5000/api/reports/export-csv?type=donations \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>"
```

---

## 🔒 Security & Medical Governance
- **Strict Role-Based Authorization**: Every sensitive action (checking in a donor, creating a camp, updating user roles) is checked against authorized roles (`admin`, `coordinator`, `volunteer`).
- **Data Privacy & Explicit Consent**: Storing donor blood groups and contact details is governed by explicit consent flags with user-facing toggles in the Profile settings.
- **Medical Disclaimer**: Regulatory banner clearly states that online bookings represent screening reservations; actual donor eligibility (vitals, hemoglobin, medical history) is determined on-site by qualified healthcare staff.
- **Atomic Capacity Checks**: Camp capacities and slot intervals are checked dynamically on the backend to prevent overbooking and race conditions.
