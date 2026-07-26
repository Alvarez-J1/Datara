# Datara — Sales Analytics Dashboard
Datara is a full-stack sales analytics dashboard that helps teams monitor revenue, customer performance, and business insights through interactive data visualizations. It features secure authentication, customizable dashboard settings, responsive data tables, and dynamic KPI reporting, powered by a Java Spring Boot backend with PostgreSQL and a modern Next.js frontend.

<img width="1136" height="676" alt="image" src="https://github.com/user-attachments/assets/96a48bb2-a2b3-4bda-90d0-46a689b3ce0f" />



## Live Demo

https://datara-dashboard.vercel.app/

## Features

- Responsive dashboard layout
- Dark and light mode theme toggle
- KPI summary cards
- Interactive sales chart
- Sidebar navigation
- Authentication-based UI
- Clean component structure
- Mobile-friendly design

## Tech Stack

React • Next.js • TypeScript • Material UI • Chart.js • SCSS • Java • Spring Boot • Spring Security • JWT • Spring Data JPA • PostgreSQL • REST APIs • Docker

## What I Practiced

- Building reusable React components
- Working with Next.js App Router
- Styling with Material UI and SCSS modules
- Creating responsive layouts
- Managing theme state
- Displaying dashboard data with charts
- Structuring a modern front-end project

## Screenshots

## Data Page
<img width="1517" height="728" alt="image" src="https://github.com/user-attachments/assets/f73b59b0-2bde-48b1-932f-92c10e58d117" />

## Mobile View
<img width="362" height="647" alt="image" src="https://github.com/user-attachments/assets/16f3b765-4747-49ca-9adb-3f4f3285d940" />


## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

Clone the repository:

```bash
git clone https://github.com/Alvarez-J1/Datara.git
```

Go into the project folder:

```bash
cd Datara
```

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open: http://localhost:3000 in your browser.

## Project Structure
```text
Frontend (src/)
src/
├── middleware.ts                 # Protects /dashboard/* (cookie auth check)
├── app/                          # Next.js App Router pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── providers.tsx             # MUI / theme providers
│   ├── auth/
│   │   └── signin/page.tsx       # Login / sign-up
│   └── dashboard/
│       ├── layout.tsx            # Dashboard shell (header, sidebar)
│       ├── page.tsx              # Main KPI dashboard
│       ├── data/page.tsx         # Revenue data table
│       ├── profile/page.tsx      # User profile
│       └── settings/page.tsx     # Workspace settings
│
├── components/                   # Reusable UI
│   ├── Login/                    # Auth form
│   ├── Header/                   # Top nav
│   ├── SideMenu/                 # Sidebar nav
│   ├── Footer/
│   ├── DataChart/                # Chart.js wrapper
│   └── Dashboard/                # KPI cards, charts, ribbons
│
├── lib/
│   ├── demoMode.ts               # Demo workspace cookie logic
│   └── api/                      # Backend API client
│       ├── client.ts             # fetch wrapper, JWT storage
│       ├── auth.ts               # login / register / profile
│       ├── dashboard.ts
│       ├── analytics.ts
│       └── settings.ts
│
└── theme/                        # MUI theme config

Backend (backend/)
backend/
├── Dockerfile
├── pom.xml
└── src/main/
    ├── java/com/datara/
    │   ├── DataraApplication.java
    │   │
    │   ├── auth/                 # Login, register, profile
    │   │   ├── AuthController.java
    │   │   ├── AuthService.java
    │   │   └── dto/
    │   │
    │   ├── security/             # JWT + Spring Security
    │   │   ├── SecurityConfig.java
    │   │   ├── JwtService.java
    │   │   └── JwtAuthenticationFilter.java
    │   │
    │   ├── user/                 # User entity + repo
    │   ├── settings/             # Workspace settings API
    │   ├── dashboard/            # KPI summary + panels
    │   ├── analytics/            # Charts data (revenue, retention, etc.)
    │   │   ├── AnalyticsController.java
    │   │   ├── AnalyticsService.java
    │   │   ├── model/
    │   │   └── repository/
    │   │
    │   ├── revenue/              # Revenue table API
    │   │   ├── RevenueController.java
    │   │   ├── RevenueService.java
    │   │   └── RevenueSpecifications.java
    │   │
    │   ├── config/               # CORS, JWT props, demo seeder
    │   ├── common/               # Shared enums / responses
    │   └── exception/            # Global error handling
    │
    └── resources/
        ├── application.yml       # Shared config
        ├── application-dev.yml   # H2 (local dev)
        ├── application-prod.yml  # PostgreSQL
        └── db/migration/         # Flyway SQL
            ├── V1__init.sql
            ├── V2__analytics_expansion.sql
            ├── V3__retention.sql
            └── V4__user_settings_v2.sql
```

## Author
Joel Alvarez
