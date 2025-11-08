# Backend Structure Document for isp-manager-fullstack

## 1. Backend Architecture

Overview
- The backend is built on Next.js’s serverless framework, combining API routes and Server Actions to handle all server-side tasks.  
- Business logic lives alongside your pages in `/app/api` and in dedicated service files under `/lib`, keeping things modular and easy to find.
- Drizzle ORM connects your Next.js server code to PostgreSQL, providing type-safe database queries.
- Authentication is managed by Better Auth, with session handling and the ability to plug in role-based checks.

Scalability, Maintainability, Performance
- Serverless deployment on Vercel auto-scales with demand; you don’t have to provision or manage servers.
- Each API route is an isolated function, making it simple to update or debug a single piece without touching the rest.
- TypeScript everywhere (Next.js, Drizzle schemas, service modules) catches errors at build time, reducing runtime bugs.
- Code is organized into clear folders: `/app` for pages and routes, `/db` for schema definitions, `/lib` for business logic, and `/components` for UI.

## 2. Database Management

Database Technology
- Type: Relational (SQL)  
- System: PostgreSQL
- ORM: Drizzle ORM for type-safe queries and migrations

Data Handling Practices
- Schemas are defined in `/db/schema/*.ts` with Drizzle’s schema builder.
- Environment variable `DATABASE_URL` stores the connection string securely.
- Migrations are tracked using Drizzle’s CLI, ensuring safe schema updates.
- All read/write operations go through Drizzle, enforcing consistent data access patterns.

## 3. Database Schema

Human-Readable Table Descriptions

Clients
- **id**: unique identifier
- **name**: customer’s full name
- **address**: installation address
- **pppoe_username**: router login name
- **pppoe_password**: router login password
- **plan_id**: links to a bandwidth plan
- **created_at**, **updated_at**: timestamps

BandwidthPlans
- **id**: unique identifier
- **name**: plan label (e.g., “Basic 20 Mbps”)
- **download_limit**, **upload_limit**: numeric speed caps
- **price**: monthly charge
- **created_at**, **updated_at**

InventoryItems
- **id**: unique identifier
- **name**: item name (e.g., “Router Model X”)
- **category**: e.g., “Hardware”, “Cable”
- **quantity**: current stock
- **status**: e.g., “In Stock”, “Out of Stock”
- **created_at**, **updated_at**

Employees
- **id**: unique identifier
- **email**: login email
- **hashed_password**: stored by Better Auth
- **role**: e.g., “admin”, “technician”
- **created_at**, **updated_at**

SQL Schema (PostgreSQL)
```sql
CREATE TABLE bandwidth_plans (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  download_limit INTEGER NOT NULL,
  upload_limit INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  pppoe_username TEXT UNIQUE NOT NULL,
  pppoe_password TEXT NOT NULL,
  plan_id INTEGER REFERENCES bandwidth_plans(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE inventory_items (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```  

## 4. API Design and Endpoints

Approach
- RESTful API routes in Next.js under `/app/api`  
- Server Actions for operations tied directly to React components (inside `/app`)  
- Separation of concerns: route handlers orchestrate calls to Drizzle and to the MikroTik service.

Key Endpoints
- **Clients**
  - GET `/api/clients` – list all clients
  - POST `/api/clients` – create a new client (writes DB, calls MikroTik API)
  - PUT `/api/clients/{id}` – update client info and router settings
  - DELETE `/api/clients/{id}` – remove client and disable PPPoE

- **Bandwidth Plans**
  - GET `/api/plans`
  - POST `/api/plans`
  - PUT `/api/plans/{id}`
  - DELETE `/api/plans/{id}`

- **Inventory**
  - GET `/api/inventory`
  - POST `/api/inventory`
  - PUT `/api/inventory/{id}`
  - DELETE `/api/inventory/{id}`

- **Employees**
  - GET `/api/employees`
  - POST `/api/employees`
  - PUT `/api/employees/{id}`
  - DELETE `/api/employees/{id}`

- **MikroTik Service** (under `/lib/mikrotik.ts`, not directly exposed but used by client routes)
  - `createPppoeUser(data)`
  - `disablePppoeUser(username)`
  - `updatePppoePlan(username, plan)`

## 5. Hosting Solutions

Primary Environment
- **Vercel Serverless**: automatic scaling, zero server maintenance, built–in CDN
- Environment variables managed via Vercel’s dashboard: `DATABASE_URL`, `AUTH_SECRET`, `MIKROTIK_API_URL`, `MIKROTIK_API_TOKEN`

Alternate Option
- **Docker**: Dockerfile included for custom deployments on AWS, DigitalOcean, or on-premises. Ensures consistent environments across dev and prod.

Cost, Reliability, Scalability
- Vercel’s pay-as-you-go model keeps costs low for small teams but scales with usage.
- Global edge network reduces latency for users in different regions.

## 6. Infrastructure Components

Load Balancing & CDN
- Vercel handles traffic distribution and edge caching automatically.

Caching
- Next.js Revalidation and Incremental Static Regeneration (ISR) for dashboard data that doesn’t change every second.
- SWR or React Query on the client for in-memory caching and stale-while-revalidate.

Background Jobs
- Vercel Cron Jobs (or third-party like GitHub Actions) can trigger maintenance scripts, e.g., sync active PPPoE sessions or check inventory levels.

Logging & Error Tracking
- Integrate Sentry for runtime error monitoring.
- Use Vercel’s built-in request logs and Drizzle’s query logs for troubleshooting.

## 7. Security Measures

Authentication & Authorization
- Better Auth manages signup, login, and session cookies over HTTPS.
- Role-based access control (RBAC) enforced in API routes and Server Actions; only `admin` role can manage employees or pricing.

Data Encryption
- TLS/SSL everywhere—Vercel provides HTTPS by default.
- PostgreSQL supports encrypted connections.

Environment Variables
- No secrets in code. All credentials loaded from `process.env`.

Input Validation & Sanitization
- Validate incoming JSON bodies with Zod or custom checks before any database or router calls.

## 8. Monitoring and Maintenance

Performance Monitoring
- Vercel Analytics for request performance and usage metrics.
- Sentry for error rates and stack traces.

Database Health
- Use a managed Postgres provider (e.g., Supabase, Neon) with automatic backups and monitoring dashboards.

Maintenance Strategies
- Drizzle migrations enforce schema changes in version control.
- Scheduled cron jobs for routine data sync and clean-up.
- Use linting (ESLint), formatting (Prettier), and CI pipelines (GitHub Actions) to catch issues before deploy.

## 9. Conclusion and Overall Backend Summary

The isp-manager-fullstack backend combines serverless Next.js, PostgreSQL with Drizzle ORM, and a modular code layout to deliver a scalable, maintainable, and performant ISP management portal. Authentication via Better Auth, granular RBAC, and a dedicated MikroTik service keep core operations secure and organized. Hosted on Vercel (with Docker for fallbacks), the system benefits from edge caching, auto-scaling, and cost-effective resource usage. Together, these components form a robust foundation, allowing your team to focus on business logic—managing clients, inventory, and employees—without worrying about infrastructure undifferentiated heavy lifting.