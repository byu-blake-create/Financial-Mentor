# Financial Mentor

## App Summary

Financial Mentor is a web app that helps college students (18–25) build basic financial confidence without needing prior budgeting knowledge. The primary user is independent (paying rent, buying groceries, managing subscriptions) but still learning how to plan spending and avoid overspending. The product combines a simple budgeting dashboard with guided learning modules so users can both **track** and **improve** their habits in one place. Users can view their monthly budget, categorize planned spending, and review recent transactions. The app also surfaces learning content (“modules”) to reinforce financial literacy alongside day-to-day money decisions. This repo includes the backend foundation (Supabase + API) needed to persist data and support continued development. 

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
9. When an authenticated user navigates to the Transactions page, the system shall display all of the user's transactions sorted by date.
10. When an authenticated user navigates to the Modules page, the system shall display all available learning modules with their titles and descriptions.
11. If the `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` environment variable is missing, then the system shall refuse to start and display an error.
12. The system shall be responsive and usable on both desktop and mobile screen sizes.

### Not Complete

1. When a user selects a learning module, the system shall track their progress and mark the module as completed.
2. When an authenticated user navigates to the Dashboard, the system shall display spending trends and personalized insights based on their transaction history.
3. When a user sends a message in the AI chat, the system shall stream a financial-advice response from the OpenAI API.
4. While the AI chat service or OpenAI API is unavailable, the system shall display a clear message and prevent attempted interactions.
5. When a user creates a new transaction, the system shall automatically update the budget summary to reflect the new spending.
6. When a user's spending in a category approaches or exceeds the budgeted amount, the system shall display a warning notification.

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


