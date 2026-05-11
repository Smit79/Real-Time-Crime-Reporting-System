<div align="center">

<img src="https://img.shields.io/badge/Real--Time-Crime%20Reporting-DC2626?style=for-the-badge&logo=shield&logoColor=white" alt="Project Banner"/>

# 🚨 Real-Time Crime Reporting System

### A full-stack platform that empowers citizens to report crimes, receive geo-targeted alerts, and helps officers and administrators manage public safety in real time.

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-22.x-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express-5.x-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.x-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.x-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.IO-4.x-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

<br/>

[📖 Documentation](#-table-of-contents) · [🚀 Quick Start](#-quick-start) · [🗂 Structure](#-project-structure) · [📡 API Reference](#-api-reference) · [🤝 Contributing](#-contributing)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [User Roles & Flow](#-user-roles--flow)
- [Real-Time Features](#-real-time-features)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [Frontend Pages](#-frontend-pages)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🔍 Overview

The **Real-Time Crime Reporting System** is a production-grade, full-stack web application that enables citizens to report crimes instantly, receive location-based alerts about nearby incidents, and helps law enforcement officers manage and resolve reports efficiently. Administrators have full visibility into system activity through audit logs and analytics dashboards.

The platform uses **geo-spatial queries**, **WebSocket connections**, and **push notifications** to deliver real-time situational awareness to all stakeholders.

---

## ✨ Key Features

### 👤 For Citizens
- 📍 **Location-aware crime reporting** with map-based coordinate picking
- 🗺️ **Interactive crime map** showing incidents near your location
- 🔔 **Geo-targeted alert subscriptions** — get notified when crime occurs near any zone you monitor
- 📸 **Evidence upload** — attach images, videos, and audio to reports
- 🕵️ **Anonymous reporting** — submit without revealing identity
- ⬆️ **Community upvoting** — confirm authenticity of reports
- 📊 **Personal dashboard** — track submitted reports and their status

### 👮 For Officers
- 📋 **Report management queue** — view, verify, investigate, and resolve reports
- 🗺️ **Geo-clustered map view** of active incidents
- 📈 **Trend analytics** — identify crime patterns by type, area, and time
- 🔄 **Real-time status updates** — citizens notified instantly on status change

### 🛡️ For Administrators
- 👥 **Full user management** — roles, activation, deletion
- 📝 **Audit logs** — every critical action tracked with IP and user-agent
- 📊 **Analytics dashboard** — heatmaps, trends, peak hours, resolution rates
- 🗑️ **Content moderation** — manage and remove reports

### 🌐 Platform-wide
- ⚡ **Real-time alerts** via Socket.IO
- 🌗 **Dark / Light / System theme** support
- 📱 **Fully responsive** — mobile, tablet, and desktop
- 🔐 **JWT + Refresh token** authentication with cookie-based sessions
- 🚦 **Rate limiting** and security headers

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│          React 19 + Vite  ·  Tailwind CSS  ·  Zustand        │
│          Framer Motion  ·  Leaflet  ·  Socket.IO Client      │
└────────────────────────────┬────────────────────────────────┘
                             │  HTTPS / WSS
┌────────────────────────────▼────────────────────────────────┐
│                       API GATEWAY                            │
│          Rate Limiting  ·  CORS  ·  Helmet  ·  Morgan        │
└──────┬──────────┬──────────┬──────────┬──────────┬──────────┘
       │          │          │          │          │
  ┌────▼───┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────┐ ┌───▼────────┐
  │  Auth  │ │ Crime  │ │ Alert  │ │ Media  │ │ Analytics  │
  │Service │ │Service │ │Service │ │Service │ │  Service   │
  └────┬───┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────────┘
       │          │          │          │          │
┌──────▼──────────▼──────────▼──────────▼──────────▼─────────┐
│                      DATA LAYER                              │
│   MongoDB + PostGIS   ·   Redis Cache   ·   Cloudinary CDN  │
└─────────────────────────────────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    REAL-TIME LAYER                           │
│              Socket.IO  ·  Event Emitters                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Application Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      REQUEST LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

  HTTP Request
       │
       ▼
  Middleware (auth, roles, validation, rate-limit)
       │
       ▼
  Controller (handles request, calls service)
       │
       ├──────────────────┐
       ▼                  ▼
  Service Layer      Socket.IO Event
  (business logic)   (real-time emit)
       │                  │
       ├──────────────────┘
       ▼
  MongoDB / Cloudinary
       │
       ▼
  JSON Response → Frontend updates
```

---

```
┌─────────────────────────────────────────────────────────────┐
│                      USER FLOW                               │
└─────────────────────────────────────────────────────────────┘

  Open App
      │
      ▼
  Login / Register
      │
      ▼
  Session Hydrated (JWT + refresh token)
      │
      ▼
  ┌───────────────────────────────────────┐
  │            Role Check                 │
  └───────────────────────────────────────┘
       │              │              │
       ▼              ▼              ▼
   Citizen        Officer         Admin
  Dashboard      Dashboard      Dashboard
       │              │              │
       ▼              ▼              ▼
  Report Crime   Manage Reports  Manage Users
  View Map       Update Status   View Audit Logs
  Set Alerts     View Analytics  View Analytics
       │              │              │
       └──────────────┴──────────────┘
                      │
                      ▼
             Real-Time Updates
          (Socket.IO connection)
                      │
                      ▼
         Crime alerts → Nearby subscribers
         Status updates → Report owners
         Notifications → Dashboard badges
```

---

```
┌─────────────────────────────────────────────────────────────┐
│                  CRIME ALERT FLOW                            │
└─────────────────────────────────────────────────────────────┘

  Citizen submits crime report
              │
              ▼
  Report saved to MongoDB
              │
              ▼
  Geo query: find all AlertSubscriptions
  within the crime location radius
              │
              ▼
  For each matching subscriber:
  ├── Check crime type filter
  ├── Check minimum severity
  └── Check precise distance (Haversine)
              │
              ▼
  ┌──────────────────────────────┐
  │     Notification Channels    │
  ├──────────────────────────────┤
  │  in_app  → Notification DB   │
  │  push    → Firebase FCM      │
  │  socket  → Socket.IO emit    │
  └──────────────────────────────┘
              │
              ▼
  Frontend receives crime_alert event
              │
              ▼
  Popup shown + Map marker animated
  + Notification bell updated
```

---

## 💻 Tech Stack

### Backend
| Layer | Technology | Purpose |
|---|---|---|
| Runtime | Node.js 22 | JavaScript server environment |
| Framework | Express 5 | HTTP server and routing |
| Database | MongoDB + Mongoose | Primary data store |
| Geo queries | MongoDB 2dsphere index | Location-based queries |
| Real-time | Socket.IO 4 | WebSocket events |
| Auth | JWT + bcryptjs | Token auth and password hashing |
| File storage | Cloudinary | Media CDN and storage |
| Email | Nodemailer | Transactional emails |
| Logging | Winston | Structured log files |
| Security | Helmet + CORS + Rate Limit | HTTP hardening |
| Validation | express-validator | Request schema validation |

### Frontend
| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 19 + Vite | UI and build tooling |
| Styling | Tailwind CSS 3 | Utility-first CSS |
| Animations | Framer Motion | Page and component animations |
| State | Zustand | Global state management |
| Routing | React Router DOM 6 | Client-side routing |
| API | Axios | HTTP client with interceptors |
| Real-time | Socket.IO Client | Live event subscription |
| Maps | Leaflet + React Leaflet | Interactive crime maps |
| Charts | Recharts | Analytics visualizations |
| Forms | React Hook Form + Zod | Form handling and validation |
| Notifications | React Hot Toast | Toast alerts |
| Icons | Lucide React | Icon system |
| Dates | Day.js | Date formatting |
| Uploads | React Dropzone | Drag-and-drop file uploads |
| Theme | next-themes | Dark/light/system theme |

---

## 🗂 Project Structure

```
Real-Time Crime Reporting/
│
├── backend/
│   ├── config/
│   │   ├── db.js                    # MongoDB connection + graceful shutdown
│   │   ├── env.js                   # Centralised environment exports
│   │   ├── socket.js                # Socket.IO initialisation
│   │   └── cloudinary.js            # Cloudinary SDK configuration
│   │
│   ├── controllers/
│   │   ├── authController.js        # Register, login, logout, reset password
│   │   ├── crimeController.js       # CRUD reports, nearby, heatmap, upvote
│   │   ├── userController.js        # Profile, notifications, location, FCM
│   │   ├── adminController.js       # User management, audit logs, stats
│   │   ├── alertController.js       # Alert subscription management
│   │   ├── mediaController.js       # File upload and deletion
│   │   └── analyticsController.js   # Trends, heatmap, summary, detailed
│   │
│   ├── middleware/
│   │   ├── auth.js                  # JWT verify + protect middleware
│   │   ├── errorHandler.js          # Global error handler
│   │   ├── rateLimiter.js           # express-rate-limit (50 req/15min)
│   │   ├── validate.js              # express-validator schemas
│   │   ├── upload.js                # Multer memory storage
│   │   └── roleCheck.js             # Role-based access (citizen/officer/admin)
│   │
│   ├── models/
│   │   ├── User.js                  # User schema with geo index
│   │   ├── CrimeReport.js           # Report schema with 2dsphere index
│   │   ├── Notification.js          # In-app notification schema
│   │   ├── AuditLog.js              # Action audit trail schema
│   │   ├── AlertSubscription.js     # Geo alert zone schema
│   │   └── Media.js                 # Uploaded file metadata schema
│   │
│   ├── routes/
│   │   ├── index.js                 # Master route loader
│   │   ├── authRoutes.js            # /api/v1/auth
│   │   ├── crimeRoutes.js           # /api/v1/crimes
│   │   ├── userRoutes.js            # /api/v1/users
│   │   ├── adminRoutes.js           # /api/v1/admin
│   │   ├── alertRoutes.js           # /api/v1/alerts
│   │   ├── mediaRoutes.js           # /api/v1/media
│   │   └── analyticsRoutes.js       # /api/v1/analytics
│   │
│   ├── services/
│   │   ├── authService.js           # Token generation, email verification
│   │   ├── crimeService.js          # Report CRUD + geo queries
│   │   ├── alertService.js          # Nearby subscriber notification
│   │   ├── notificationService.js   # In-app + email + socket notifications
│   │   ├── geoService.js            # Hotspots, density, distance queries
│   │   ├── mediaService.js          # Cloudinary upload/delete helpers
│   │   └── analyticsService.js      # Aggregation pipelines
│   │
│   ├── sockets/
│   │   ├── index.js                 # Socket event registration hub
│   │   ├── crimeSocket.js           # Crime report socket events
│   │   └── alertSocket.js           # Alert broadcast socket events
│   │
│   ├── utils/
│   │   ├── apiError.js              # Custom error class
│   │   ├── apiResponse.js           # Standard response wrapper
│   │   ├── asyncHandler.js          # Try/catch wrapper for controllers
│   │   ├── generateToken.js         # JWT sign helpers
│   │   ├── sendEmail.js             # Nodemailer wrapper
│   │   ├── geoHelper.js             # Haversine, GeoJSON, bounding box
│   │   └── logger.js                # Winston logger setup
│   │
│   ├── validations/
│   │   ├── authValidation.js        # Auth request schemas
│   │   ├── crimeValidation.js       # Report request schemas
│   │   └── userValidation.js        # User request schemas
│   │
│   ├── tests/
│   │   ├── unit/
│   │   │   ├── geoHelper.test.js
│   │   │   └── authService.test.js
│   │   └── integration/
│   │       ├── auth.test.js
│   │       └── crime.test.js
│   │
│   ├── logs/
│   │   ├── error.log
│   │   └── combined.log
│   │
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   ├── server.js                    # Entry point
│   └── README.md
│
└── frontend/
    ├── public/
    │   └── crime-icon.svg
    ├── src/
    │   ├── api/
    │   │   ├── axios.js             # Axios instance + interceptors
    │   │   ├── authApi.js
    │   │   ├── crimeApi.js
    │   │   ├── userApi.js
    │   │   ├── alertApi.js
    │   │   ├── mediaApi.js
    │   │   ├── analyticsApi.js
    │   │   └── adminApi.js
    │   │
    │   ├── components/
    │   │   ├── common/              # Navbar, Sidebar, Footer, ThemeToggle
    │   │   ├── auth/                # LoginForm, RegisterForm, ProtectedRoute
    │   │   ├── crime/               # CrimeCard, CrimeForm, Badges
    │   │   ├── map/                 # CrimeMap, MapMarker, HeatmapLayer
    │   │   ├── alerts/              # AlertCard, CrimeAlertPopup, Bell
    │   │   ├── analytics/           # StatCard, Charts
    │   │   ├── admin/               # Tables for users, reports, logs
    │   │   └── media/               # FileUploader, MediaGallery
    │   │
    │   ├── pages/
    │   │   ├── auth/                # LoginPage, RegisterPage, ForgotPassword
    │   │   ├── citizen/             # Home, Map, ReportCrime, MyReports, Alerts
    │   │   ├── officer/             # OfficerDashboard, ManageReports
    │   │   ├── admin/               # AdminDashboard, Users, Reports, AuditLogs
    │   │   └── NotFoundPage.jsx
    │   │
    │   ├── store/
    │   │   ├── authStore.js
    │   │   ├── crimeStore.js
    │   │   ├── alertStore.js
    │   │   ├── notificationStore.js
    │   │   └── themeStore.js
    │   │
    │   ├── hooks/
    │   │   ├── useAuth.js
    │   │   ├── useSocket.js
    │   │   ├── useGeolocation.js
    │   │   ├── useCountUp.js
    │   │   ├── useDebounce.js
    │   │   └── usePagination.js
    │   │
    │   ├── utils/
    │   │   ├── constants.js
    │   │   ├── formatters.js
    │   │   ├── geoHelper.js
    │   │   └── validators.js
    │   │
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    │
    ├── .env
    ├── .env.example
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 🗄 Database Schema

### Core Models

```
┌─────────────────────────────────────────────────────────────┐
│  User                                                        │
├─────────────────┬───────────────────────────────────────────┤
│ _id             │ ObjectId (PK)                             │
│ fullName        │ String, required                          │
│ email           │ String, unique, lowercase                 │
│ phone           │ String, unique, sparse                    │
│ password        │ String, hashed (bcryptjs), select: false  │
│ role            │ Enum: citizen | officer | admin           │
│ avatar          │ String (Cloudinary URL)                   │
│ isVerified      │ Boolean, default: false                   │
│ isActive        │ Boolean, default: true                    │
│ location        │ GeoJSON Point (2dsphere index)            │
│ fcmToken        │ String (Firebase push token)              │
│ refreshToken    │ String, select: false                     │
│ createdAt       │ Date (auto)                               │
│ updatedAt       │ Date (auto)                               │
└─────────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  CrimeReport                                                 │
├─────────────────┬───────────────────────────────────────────┤
│ _id             │ ObjectId (PK)                             │
│ reportedBy      │ ObjectId → User (null if anonymous)       │
│ isAnonymous     │ Boolean                                   │
│ crimeType       │ Enum: theft|robbery|assault|murder|...    │
│ title           │ String, max 100                           │
│ description     │ String, max 1000                          │
│ location        │ GeoJSON Point (2dsphere index)            │
│ address         │ { street, city, state, pincode, full }    │
│ severity        │ Number 1–5                                │
│ status          │ Enum: pending|verified|investigating|...  │
│ mediaUrls       │ [{ url, fileType, publicId }]             │
│ witnesses       │ Number                                    │
│ verifiedBy      │ ObjectId → User                           │
│ verifiedAt      │ Date                                      │
│ resolvedAt      │ Date                                      │
│ upvotes         │ [ObjectId → User]                         │
│ incidentTime    │ Date                                      │
│ createdAt       │ Date (auto)                               │
└─────────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AlertSubscription                                           │
├─────────────────┬───────────────────────────────────────────┤
│ _id             │ ObjectId (PK)                             │
│ user            │ ObjectId → User                           │
│ label           │ String (e.g. "Home", "Office")            │
│ location        │ GeoJSON Point (2dsphere index)            │
│ radiusKm        │ Number 1–50, default: 5                   │
│ crimeTypes      │ [String] (empty = all types)              │
│ minSeverity     │ Number 1–5, default: 1                    │
│ isActive        │ Boolean                                   │
│ channels        │ { push, email, in_app }                   │
│ createdAt       │ Date (auto)                               │
└─────────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Notification                                                │
├─────────────────┬───────────────────────────────────────────┤
│ _id             │ ObjectId (PK)                             │
│ recipient       │ ObjectId → User                           │
│ type            │ Enum: crime_alert|report_verified|...     │
│ title           │ String                                    │
│ message         │ String                                    │
│ data            │ { reportId, crimeType, location }         │
│ isRead          │ Boolean, default: false                   │
│ readAt          │ Date                                      │
│ channel         │ Enum: push|email|in_app|sms               │
│ isSent          │ Boolean                                   │
│ createdAt       │ Date (auto)                               │
└─────────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  AuditLog                                                    │
├─────────────────┬───────────────────────────────────────────┤
│ _id             │ ObjectId (PK)                             │
│ performedBy     │ ObjectId → User                           │
│ action          │ Enum: user_login|report_created|...       │
│ targetType      │ Enum: User|CrimeReport|System             │
│ targetId        │ ObjectId                                  │
│ description     │ String                                    │
│ ipAddress       │ String                                    │
│ userAgent       │ String                                    │
│ metadata        │ Mixed                                     │
│ createdAt       │ Date (auto)                               │
└─────────────────┴───────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Media                                                       │
├─────────────────┬───────────────────────────────────────────┤
│ _id             │ ObjectId (PK)                             │
│ uploadedBy      │ ObjectId → User                           │
│ report          │ ObjectId → CrimeReport (nullable)         │
│ url             │ String (Cloudinary URL)                   │
│ publicId        │ String (Cloudinary public_id)             │
│ fileType        │ Enum: image|video|audio                   │
│ mimeType        │ String                                    │
│ sizeBytes       │ Number                                    │
│ originalName    │ String                                    │
│ isDeleted       │ Boolean (soft delete)                     │
│ createdAt       │ Date (auto)                               │
└─────────────────┴───────────────────────────────────────────┘
```

### Relationships

```
User ──────────────── CrimeReport (reportedBy, verifiedBy)
User ──────────────── AlertSubscription (user)
User ──────────────── Notification (recipient)
User ──────────────── AuditLog (performedBy)
User ──────────────── Media (uploadedBy)
CrimeReport ────────── Media (report)
CrimeReport ────────── Notification (data.reportId)
```

---

## 📡 API Reference

### Base URL
```
http://localhost:5000/api/v1
```

### Authentication
All protected routes require:
```
Authorization: Bearer <accessToken>
```
Or cookie: `accessToken` (set automatically on login).

---

### 🔐 Auth Endpoints `/auth`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/auth/register` | Public | Register new user |
| POST | `/auth/login` | Public | Login and get tokens |
| POST | `/auth/logout` | Private | Logout and clear tokens |
| POST | `/auth/refresh-token` | Private | Refresh access token |
| GET | `/auth/me` | Private | Get current user |
| PATCH | `/auth/update-password` | Private | Change password |
| POST | `/auth/forgot-password` | Public | Send reset email |
| POST | `/auth/reset-password/:token` | Public | Reset password |
| POST | `/auth/verify-email/:token` | Public | Verify email address |

---

### 🚨 Crime Endpoints `/crimes`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/crimes` | Public | List all reports (filters + pagination) |
| GET | `/crimes/nearby` | Public | Reports near coordinates `?lat&lng&radius` |
| GET | `/crimes/heatmap` | Public | Heatmap cluster data |
| GET | `/crimes/:id` | Public | Get single report |
| POST | `/crimes` | Private | Submit new crime report |
| PATCH | `/crimes/:id` | Private | Update own report |
| DELETE | `/crimes/:id` | Private | Delete own report |
| POST | `/crimes/:id/upvote` | Private | Toggle upvote |
| PATCH | `/crimes/:id/status` | Officer/Admin | Update report status |

**Query Parameters for `GET /crimes`:**
```
page        → 1
limit       → 10
status      → pending|verified|investigating|resolved|rejected
crimeType   → theft|robbery|assault|murder|...
severity    → 1|2|3|4|5
search      → keyword
startDate   → ISO date
endDate     → ISO date
sortBy      → createdAt|severity
order       → asc|desc
```

---

### 👤 User Endpoints `/users`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/users/profile` | Private | Get own profile |
| PATCH | `/users/profile` | Private | Update profile + avatar |
| DELETE | `/users/profile` | Private | Deactivate account |
| GET | `/users/my-reports` | Private | Get own reports |
| GET | `/users/my-notifications` | Private | Get notifications |
| PATCH | `/users/notifications/read` | Private | Mark notifications read |
| PATCH | `/users/location` | Private | Update live location |
| PATCH | `/users/fcm-token` | Private | Update push token |

---

### 🔔 Alert Endpoints `/alerts`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/alerts` | Private | Get own subscriptions |
| POST | `/alerts` | Private | Create subscription |
| GET | `/alerts/:id` | Private | Get subscription by ID |
| PATCH | `/alerts/:id` | Private | Update subscription |
| DELETE | `/alerts/:id` | Private | Delete subscription |
| PATCH | `/alerts/:id/toggle` | Private | Toggle active/inactive |

---

### 📁 Media Endpoints `/media`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| POST | `/media/upload` | Private | Upload files (max 5, 50MB each) |
| GET | `/media` | Private | Get own media files |
| GET | `/media/:id` | Private | Get media by ID |
| DELETE | `/media/:id` | Private | Delete media file |

---

### 📊 Analytics Endpoints `/analytics`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/analytics/heatmap` | Public | Heatmap points with weight |
| GET | `/analytics/summary` | Public | Total counts overview |
| GET | `/analytics/trends` | Private | Crime trends over time |
| GET | `/analytics/by-type` | Private | Breakdown by crime type |
| GET | `/analytics/by-area` | Private | Breakdown by area/city |
| GET | `/analytics/detailed` | Officer/Admin | Full report with all stats |

---

### 🛡 Admin Endpoints `/admin`

| Method | Endpoint | Access | Description |
|--------|----------|--------|-------------|
| GET | `/admin/users` | Admin | List all users |
| GET | `/admin/users/:id` | Admin | Get user by ID |
| PATCH | `/admin/users/:id/role` | Admin | Change user role |
| PATCH | `/admin/users/:id/status` | Admin | Toggle active/inactive |
| DELETE | `/admin/users/:id` | Admin | Hard delete user |
| GET | `/admin/reports` | Admin | List all reports |
| DELETE | `/admin/reports/:id` | Admin | Hard delete report |
| GET | `/admin/audit-logs` | Admin | Get audit trail |
| GET | `/admin/stats` | Admin | Dashboard statistics |

---

### Standard Response Format

**Success:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "stack": "...shown in development only"
}
```

---

## 👥 User Roles & Flow

### Role Permissions

```
┌──────────────────────────────────────────────────────────────┐
│  Feature                   │ Citizen │ Officer │ Admin       │
├──────────────────────────────────────────────────────────────┤
│  Register / Login          │   ✅    │   ✅    │   ✅        │
│  View public crime reports │   ✅    │   ✅    │   ✅        │
│  Submit crime report       │   ✅    │   ✅    │   ✅        │
│  Edit own report           │   ✅    │   ✅    │   ✅        │
│  Delete own report         │   ✅    │   ✅    │   ✅        │
│  Upvote reports            │   ✅    │   ✅    │   ✅        │
│  Create alert subscription │   ✅    │   ✅    │   ✅        │
│  Upload evidence media     │   ✅    │   ✅    │   ✅        │
│  View own notifications    │   ✅    │   ✅    │   ✅        │
│  Update report status      │   ❌    │   ✅    │   ✅        │
│  View all users            │   ❌    │   ❌    │   ✅        │
│  Change user roles         │   ❌    │   ❌    │   ✅        │
│  Delete any report         │   ❌    │   ❌    │   ✅        │
│  Delete users              │   ❌    │   ❌    │   ✅        │
│  View audit logs           │   ❌    │   ❌    │   ✅        │
│  Detailed analytics        │   ❌    │   ✅    │   ✅        │
└──────────────────────────────────────────────────────────────┘
```

---

## ⚡ Real-Time Features

### Socket.IO Events

**Client → Server:**
```
join_user_room(userId)     Join personal notification room
join_zone(zoneId)          Join geo alert zone room
leave_zone(zoneId)         Leave geo alert zone room
user_online(userId)        Broadcast online status
```

**Server → Client:**
```
crime_alert               New crime near subscriber zone
notification              Personal in-app notification
report_verified           Report owner notified of verification
report_resolved           Report owner notified of resolution
user_status               User online/offline status
```

### Alert Matching Logic
```
New crime report submitted
         │
         ▼
Find AlertSubscriptions where:
  location within 50km of crime (initial broad query)
  isActive = true
         │
         ▼
For each subscription, check:
  1. crimeType in sub.crimeTypes (or empty = all)
  2. crime.severity >= sub.minSeverity
  3. Haversine distance <= sub.radiusKm
         │
         ▼
Send via enabled channels:
  in_app  → Create Notification document
  push    → Firebase FCM
  socket  → io.to(`zone_${sub._id}`).emit('crime_alert')
```

---

## 🚀 Quick Start

### Prerequisites
```
Node.js >= 20
MongoDB Atlas account or local MongoDB
Cloudinary account
Gmail account with App Password
```

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/real-time-crime-reporting.git
cd real-time-crime-reporting
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Fill in all .env values (see Environment Variables section)
npm run dev
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# Fill in frontend .env values
npm run dev
```

### 4. Open in browser
```
Frontend → http://localhost:5173
Backend  → http://localhost:5000
Health   → http://localhost:5000/health
```

---

## 🔑 Environment Variables

### Backend `.env`

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/crime_reporting_db

# JWT
JWT_SECRET=your_super_secret_jwt_key_minimum_32_chars
JWT_EXPIRES_IN=7d
REFRESH_SECRET=your_refresh_token_secret_minimum_32_chars
REFRESH_EXPIRES_IN=30d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail with App Password)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=xxxx xxxx xxxx xxxx
EMAIL_FROM=CrimeWatch <your_email@gmail.com>

# Firebase FCM (optional)
FCM_SERVER_KEY=your_fcm_server_key

# Client URLs
CLIENT_URLS=http://localhost:5173
RESET_LINK_BASE_URL=http://localhost:5173
VERIFY_LINK_BASE_URL=http://localhost:5173
```

### Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=CrimeWatch
VITE_GOOGLE_MAPS_KEY=your_google_maps_key
```

---

## 🖥 Frontend Pages

| Page | Route | Access | Description |
|------|-------|--------|-------------|
| Login | `/login` | Public | Email/password authentication |
| Register | `/register` | Public | New account creation |
| Forgot Password | `/forgot-password` | Public | Password reset email |
| Home | `/home` | Citizen | Crime feed + mini map |
| Map | `/map` | Citizen | Full screen crime map |
| Report Crime | `/report` | Citizen | Multi-step report form |
| My Reports | `/my-reports` | Citizen | Own reports list |
| Alerts | `/alerts` | Citizen | Alert subscriptions |
| Profile | `/profile` | All | Account settings |
| Officer Dashboard | `/officer/dashboard` | Officer | Report management |
| Manage Reports | `/officer/reports` | Officer | Status updates |
| Admin Dashboard | `/admin/dashboard` | Admin | Full analytics |
| Manage Users | `/admin/users` | Admin | User management |
| Admin Reports | `/admin/reports` | Admin | All reports |
| Audit Logs | `/admin/audit-logs` | Admin | Action history |
| 404 | `*` | All | Not found page |

---

## 🧪 Testing

### Postman Collection
Import the Postman collection and environment from the `/postman` folder:
```
postman/
├── Crime_Reporting_API.postman_collection.json
└── Crime_Reporting_Local.postman_environment.json
```

### Testing Order
```
1. Register 3 users (citizen, officer, admin)
2. Promote officer and admin roles in MongoDB
3. Login all 3 users → tokens saved automatically
4. Test Auth → Users → Crimes → Alerts → Media → Analytics → Admin
5. Test error cases → 401, 403, 404, 400, 409, 429
```

### Run Tests
```bash
cd backend
npm test
```

---

## 📦 Deployment

### Backend (Railway / Render)
```bash
# Set environment variables in dashboard
# Deploy with:
npm start
```

### Frontend (Vercel / Netlify)
```bash
npm run build
# Deploy the dist/ folder
# Set VITE_API_URL to your production backend URL
```

### Docker (optional)
```bash
docker-compose up --build
```

---

## 📋 Scripts

### Backend
```bash
npm run dev        # Start with nodemon (development)
npm run start      # Start with node (production)
npm run seed:demo  # Seed demo data
npm run test       # Run test suite
```

### Frontend
```bash
npm run dev        # Vite dev server
npm run build      # Production build
npm run preview    # Preview production build
npm run lint       # ESLint check
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit your changes
   ```bash
   git commit -m "feat: add your feature description"
   ```
4. Push to the branch
   ```bash
   git push origin feature/your-feature-name
   ```
5. Open a Pull Request

### Commit Convention
```
feat:     New feature
fix:      Bug fix
docs:     Documentation changes
style:    Formatting changes
refactor: Code restructure
test:     Adding tests
chore:    Build/config changes
```

---

## 🔐 Security

- All passwords hashed with bcryptjs (salt rounds: 12)
- JWT tokens expire in 7 days; refresh tokens in 30 days
- Refresh token stored in DB — invalidated on logout
- Rate limiting: 50 requests per 15 minutes per IP
- Helmet.js sets 11 security-related HTTP headers
- CORS restricted to configured client origins
- File uploads validated by MIME type and size (50MB max)
- Anonymous reports strip PII before storage
- Input validated with express-validator on every endpoint

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Smit** — Final Year Computer Science Student

> Built as a final year college project demonstrating full-stack development with real-time features, geo-spatial queries, and production-grade backend architecture.

---

<div align="center">

**⭐ Star this repo if you found it helpful!**

Made with ❤️ and a lot of ☕

</div>
