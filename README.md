# Financial Mentor

## App Summary

Financial Mentor is a web app that helps college students (18–25) build basic financial confidence without needing prior budgeting knowledge. The primary user is independent (paying rent, buying groceries, managing subscriptions) but still learning how to plan spending and avoid overspending. The product combines a simple budgeting dashboard with guided learning modules so users can both **track** and **improve** their habits in one place. Users can view their monthly budget, categorize planned spending, and review recent transactions. The app also surfaces learning content (“modules”) to reinforce financial literacy alongside day-to-day money decisions. This repo includes the backend foundation (Supabase + API) needed to persist data and support continued development. 

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Wouter (routing), TanStack React Query, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| **Backend** | Node.js 20, Express 5, TypeScript, Passport.js (authentication), express-session |
| **Database** | Supabase (Postgres) |
| **Authentication** | Passport.js with Local Strategy (email/password), bcrypt for password hashing |
| **External Services** | OpenAI API (AI chat assistant) |

## Architecture Diagram

```
┌───────────┐         HTTPS          ┌──────────────────────────────────┐
│           │ ──────────────────────► │         Express Server           │
│  Browser  │   React SPA (Vite)     │        (Node.js / TS)            │
│  (User)   │ ◄────────────────────  │                                  │
│           │   HTML/CSS/JS assets   │  ┌────────────┐ ┌─────────────┐  │
└───────────┘                        │  │  REST API   │ │  Passport   │  │
      ▲                              │  │  /api/*     │ │  Auth       │  │
      │                              │  └──────┬─────┘ └─────────────┘  │
      │  TanStack React Query        │         │                        │
      │  fetch + SSE (chat)          │  ┌──────▼─────┐                  │
      │                              │  │ Supabase   │                  │
      └──────────────────────────    │  │ JS Client  │                  │
                                     └─────────┼────────────────────────┘
                                               │
                                               │  Queries
                                               ▼
                                     ┌──────────────────┐
                                     │     Supabase      │
                                     │                   │
                                     │  users, budgets,  │
                                     │  categories,      │
                                     │  transactions,    │
                                     │  modules          │
                                     └──────────────────┘

                                     ┌──────────────────┐
         Express Server  ──────────► │   OpenAI API     │
           (SSE stream)              │   (GPT chat)     │
                                     └──────────────────┘
```

**Communication flow:**
- The **browser** loads the React single-page application served by the Express backend.
- The frontend makes **REST API** calls (`/api/*`) to the backend using TanStack React Query.
- The backend authenticates requests via **Passport.js** session cookies.
- The backend reads and writes data to **Supabase** via the Supabase JS client.
- The AI chat feature streams responses from the **OpenAI API** to the frontend via **Server-Sent Events (SSE)**.

## Prerequisites

Before running this project locally, ensure the following software is installed:

| Software | Minimum Version | Verify Command | Installation |
|---|---|---|---|
| **Node.js** | 20.x | `node -v` | [nodejs.org](https://nodejs.org/) |
| **npm** | 10.x | `npm -v` | Included with Node.js |
| **Supabase** | N/A | N/A | [supabase.com](https://supabase.com/) |

```bash
node -v
npm -v
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/lukehoop/Financial-Mentor.git
cd Financial-Mentor
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the project root:

```bash
PORT=4000
SESSION_SECRET=your-session-secret-here
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default: `5000`) |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

## Running the Application

Start the development server:

```bash
npm run dev
```

This launches both the Express backend and the Vite dev server. Open your browser and navigate to:

```
http://localhost:4000
```

*(Replace `4000` with the port you set in `.env`.)*

## Verifying the Vertical Slice

The vertical slice demonstrates the **budget management** feature end-to-end — from the UI through the API to the database and back.

### 1. Log in

Navigate to `http://localhost:4000` and log in with a seeded user:

- **Email:** `user@example.com`
- **Password:** `password123`

### 2. View the dashboard

After logging in you will be redirected to the **Dashboard**, which displays a summary of your current budget, recent transactions, and learning modules.

### 3. Create or edit a budget category

Navigate to the **Budget** page from the sidebar. You should see the existing budget with categories displayed in a pie chart. Add a new category (e.g., "Subscriptions" with an allocated amount of $50) or edit an existing category's allocated amount.

### 4. Confirm the database was updated

Open the Supabase dashboard and check the relevant table (for example `budget_categories`) to confirm your newly created or updated row exists.

### 5. Verify persistence

Refresh the page in your browser. The budget page should still reflect the changes you made — the new or updated category should appear in both the category list and the pie chart, confirming that the data was persisted to Supabase.


