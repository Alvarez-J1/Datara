# Datara — Sales Analytics Dashboard

Datara is a responsive front-end sales analytics dashboard built with Next.js, React, TypeScript, Material UI, and Chart.js.

The project focuses on clean UI, dashboard-style layouts, interactive data visualization, responsive design, and modern front-end architecture.

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

React • Next.js • TypeScript  • Material UI • Chart.js • Sass/SCSS • NextAuth • Git • Vercel

## What I Practiced

- Building reusable React components
- Working with Next.js App Router
- Styling with Material UI and SCSS modules
- Creating responsive layouts
- Managing theme state
- Displaying dashboard data with charts
- Structuring a modern front-end project

## Screenshots
## Desktop View
<img width="1901" height="909" alt="datara" src="https://github.com/user-attachments/assets/ca264924-58fe-40c2-b69b-a50e4de20b05" />


## Data Page
<img width="1899" height="912" alt="image" src="https://github.com/user-attachments/assets/38d160bb-c14f-475d-a703-fbe6798548ff" />

## Mobile View
<img width="503" height="773" alt="image" src="https://github.com/user-attachments/assets/2fd75501-140e-4185-b9ad-fd8897d4fab9" />

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
Datara/
├── src/
│   ├── app/
│   │   ├── api/auth/[...nextauth]/
│   │   ├── auth/signin/
│   │   ├── dashboard/
│   │   │   ├── data/
│   │   │   ├── profile/
│   │   │   ├── settings/
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── Dashboard/
│   │   ├── DataChart/
│   │   ├── Footer/
│   │   ├── Header/
│   │   ├── Login/
│   │   ├── SideMenu/
│   │   └── mockData.ts
│   ├── helper/
│   ├── theme/
│   ├── middleware.ts
│   └── layout.module.scss
├── public/
├── .storybook/
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
└── README.md
```

## Author
Joel Alvarez
