# Prosper

## App Summary

Prosper is a web app that helps college students (18–25) build basic financial confidence without needing prior budgeting knowledge. The primary user is independent (paying rent, buying groceries, managing subscriptions) but still learning how to plan spending and avoid overspending. The product combines a simple budgeting dashboard with guided learning modules so users can both **track** and **improve** their habits in one place. Users can view their monthly budget, categorize planned spending, and track active financial goals. The app also surfaces learning content (“modules”) to reinforce financial literacy alongside day-to-day money decisions. This repo includes the backend foundation (Supabase + API) needed to persist data and support continued development. 

**Update:** The legacy Transactions page has been removed from the UI. The Dashboard now includes a **Goals preview** section that surfaces your active goals (from the Goals page). It also includes **Up Next** and **Watchlist** learning sections so users can keep track of unwatched modules and modules they saved for later. New accounts also automatically get a default budget row so the Budget page loads immediately.

## EARS Requirements

### Complete

1. The system shall store passwords as bcrypt hashes and never persist or transmit plaintext passwords.
2. The system shall only display data belonging to the currently authenticated user.
3. While a user is not authenticated, the system shall redirect all routes to the login page.
4. When a user submits the sign-up form with a valid email, password, first name, and last name, the system shall create a new account and log the user in automatically.
5. When a user submits the login form with valid credentials, the system shall authenticate the user and establish a session cookie.
6. When a user submits the login form with invalid credentials, the system shall display an error message.
7. When an authenticated user navigates to the Budget page, the system shall display their current budget with all categories and a pie chart breakdown.
8. When a user creates, edits, or deletes a budget category, the system shall persist the change to the database and update the UI accordingly.
9. When an authenticated user navigates to the Goals page, the system shall display the user's goals.
10. When an authenticated user navigates to the Modules page, the system shall display all available learning modules with their titles and descriptions.
11. If the `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing, then the system shall refuse to start and display an error.
12. The system shall be responsive and usable on both desktop and mobile screen sizes.
13. When a user sends a message in the AI chat, the system shall stream a financial-advice response from the OpenAI API.
14. While the AI chat service or OpenAI API is unavailable, the system shall display a clear message and prevent attempted interactions.

### Not Complete

1. When a user selects a learning module, the system shall track their progress and mark the module as completed.
2. When an authenticated user navigates to the Dashboard, the system shall display spending trends and personalized insights based on their transaction history.

3. When a user creates a new transaction, the system shall automatically update the budget summary to reflect the new spending.
4. When a user's spending in a category approaches or exceeds the budgeted amount, the system shall display a warning notification.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Wouter (routing), TanStack React Query, Tailwind CSS, shadcn/ui, Recharts, Framer Motion |
| **Backend** | Node.js 20, Express 5, TypeScript, Passport.js (authentication), express-session |
| **Database** | Supabase (Postgres) |
| **Authentication** | Passport.js with Local Strategy (email/password), bcrypt for password hashing |
| **External Services** | Gemini API (AI chat assistant) |

## AI Chatbot

The AI chatbot ("Prosper") provides conversational financial coaching in the app's **Chat** page.

### What it does

- Starts and manages conversations per authenticated user.
- Streams assistant responses in real time (SSE) for a smoother chat experience.
- Supports Markdown in assistant messages for readable lists and structured explanations.
- Shows clear loading/typing state while a response is being generated.

### Accessibility and Mobile UX

The chat interface is designed to meet Lighthouse accessibility expectations by using:

- Semantic regions (`header`, `main`, `footer`) and accessible labels.
- Properly labeled controls for icon buttons and message input.
- Keyboard-visible focus rings and screen-reader friendly status updates.
- Improved contrast for action buttons and user message bubbles.
- Responsive spacing and message widths for smaller screens.
- Dynamic viewport height handling (`dvh`) so the chat layout fits mobile browsers more reliably.

### Current limitation

- Voice input button is present for future functionality but currently disabled.

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
                                     │  modules, goals   │
                                     └──────────────────┘

                                     ┌──────────────────┐
         Express Server  ──────────► │   Gemini API     │
           (SSE stream)              │   (AI chat)     │
                                     └──────────────────┘
```

**Communication flow:**
- The **browser** loads the React single-page application served by the Express backend.
- The frontend makes **REST API** calls (`/api/*`) to the backend using TanStack React Query.
- The backend authenticates requests via **Passport.js** session cookies.
- The backend reads and writes data to **Supabase** via the Supabase JS client.
- The AI chat feature streams responses from the **GEMINI API** to the frontend via **Server-Sent Events (SSE)**.

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

Start from the provided `.env.example` template and create a local `.env` file in the project root:

```bash
cp .env.example .env
```

Then fill in the values in `.env` with your own credentials. Keep this file untracked and do not commit secrets:

```bash
PORT=4000
SESSION_SECRET=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
GEMINI_MODEL=gemini-flash-latest
```

| Variable | Description |
|---|---|
| `PORT` | Port the server listens on (default: `5000`) |
| `SESSION_SECRET` | Secret used to sign session cookies |
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `GEMINI_API_KEY` | API key for the AI chat integration |
| `GEMINI_MODEL` | Optional Gemini model override |

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

## Deployment Update

Prosper is currently hosted on **Render** as a web service. We moved deployment to Render because this project uses a full **Express + Vite** setup rather than a static frontend only.

### Render Configuration

- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`
- **Environment Variables:** configured in the Render dashboard
- **Port:** provided automatically by Render through the `PORT` environment variable

## Verifying the Vertical Slice

The vertical slice demonstrates the **budget management** feature end-to-end — from the UI through the API to the database and back.

### 1. Log in

Navigate to `http://localhost:4000` and log in with a seeded user:

- **Email:** `user@example.com`
- **Password:** `password123`

### 2. View the dashboard

After logging in you will be redirected to the **Dashboard**, which displays a summary of your current budget, a **Goals preview**, and learning modules. The learning area includes **Up Next** for unwatched modules and **Watchlist** for modules the user has explicitly saved for later.

### 3. Create or edit a budget category

Navigate to the **Budget** page from the sidebar. You should see the existing budget with categories displayed in a pie chart. Add a new category (e.g., "Subscriptions" with an allocated amount of $50) or edit an existing category's allocated amount.

### 4. Confirm the database was updated

Open the Supabase dashboard and check the relevant table (for example `budget_categories`) to confirm your newly created or updated row exists.

### 5. Verify persistence

Refresh the page in your browser. The budget page should still reflect the changes you made — the new or updated category should appear in both the category list and the pie chart, confirming that the data was persisted to Supabase.
