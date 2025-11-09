# Project Requirements Document (PRD)

## 1. Project Overview

**isp-manager-fullstack** is a Next.js full-stack starter kit tailored for building a custom Internet Service Provider (ISP) management portal. Its primary purpose is to eliminate boilerplate work by providing a ready-to-use foundation—complete with authentication, database integration, and a modern UI library—so developers can focus on implementing business logic for managing clients, PPPoE credentials, inventory, and employees. This starter kit follows best practices in security, type safety, and modular code organization.

We’re building this portal to help ISPs automate and centralize their daily operations: from onboarding new PPPoE users on MikroTik RouterOS 7 to tracking inventory and managing staff access. Key success criteria include:

*   A secure, role-based authentication flow that distinguishes between admins and technicians.
*   Full CRUD (Create, Read, Update, Delete) workflows for clients, plans, inventory items, and employees.
*   Reliable integration with a MikroTik REST API so that database changes sync with network configurations.
*   A polished, responsive UI built with shadcn/ui and Tailwind CSS, deployed smoothly on Vercel or within Docker.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1)**

*   Secure employee authentication and session management using Better Auth.
*   Role-Based Access Control (RBAC) distinguishing at least `admin` and `technician` roles.
*   A protected dashboard with navigation to Clients, Inventory, Plans, and Employees pages.
*   PostgreSQL integration via Drizzle ORM with schemas for `clients`, `bandwidth_plans`, `inventory_items`, and `employees`.
*   CRUD API routes and Next.js Server Actions for all primary entities.
*   A `/lib/mikrotik.ts` service module for creating, updating, and disabling PPPoE users on RouterOS 7.
*   UI components (tables, forms, dialogs) built with shadcn/ui and styled by Tailwind CSS.
*   Environment variable management for DB URL, auth secret, and router credentials.
*   Basic error handling and logging for database operations and RouterOS calls.

**Out-of-Scope (Planned for Later Phases)**

*   Real-time monitoring of PPPoE sessions or bandwidth usage.
*   Automated billing/invoicing or payment gateway integration.
*   Advanced reporting, analytics dashboards, or charting libraries.
*   Mobile-specific UI or a separate mobile app.
*   Email/SMS notifications or in-app messaging.
*   Background cron jobs for data synchronization (e.g., Vercel Cron) unless explicitly added later.

## 3. User Flow

When an employee arrives at the portal, they land on a login page. After entering valid credentials, the system verifies their role (admin or technician) and redirects them to a unified dashboard. The dashboard features a top navigation bar with a logo and profile menu, plus a left sidebar listing `Clients`, `Inventory`, `Plans`, and `Employees`. The main content area shows a summary card (e.g., total clients) and a table of recent entries.

To manage clients, the user clicks “Clients” in the sidebar and sees a paginated data table listing each client’s name, PPPoE username, plan, and status. An “Add Client” button opens a modal form where they input client details, select a bandwidth plan, and set PPPoE credentials. On submission, a Next.js Server Action writes to PostgreSQL via Drizzle, then calls the MikroTik API module to provision the user on the router. Success or failure is displayed via toast notifications, and the table refreshes automatically.

## 4. Core Features

*   **Authentication & RBAC**: Employee sign-up/login, session management with Better Auth, user roles (`admin`, `technician`).
*   **Protected Dashboard**: Next.js App Router guards pages and API routes for authenticated staff only.
*   **Client Management**: List, create, edit, and delete PPPoE clients; sync credentials with RouterOS.
*   **Inventory Management**: CRUD operations for inventory items, categories, and statuses.
*   **Bandwidth Plan Management**: CRUD for plans, including speed limits and pricing metadata.
*   **Employee Management**: Admin-only pages to add, edit, or remove employee accounts and roles.
*   **Database Integration**: Drizzle ORM schemas for all entities, PostgreSQL as the data store.
*   **MikroTik RouterOS Integration**: Encapsulated REST calls (`createPppoeUser`, `disablePppoeUser`, `updateUserPlan`).
*   **UI Component Library**: shadcn/ui + Tailwind CSS for tables, forms, dialogs, and notifications.
*   **Server Actions & API Routes**: Next.js co-located frontend/backend logic for secure, server-side operations.
*   **Configuration Management**: Environment variables for `DATABASE_URL`, `AUTH_SECRET`, and router credentials.
*   **Error Handling & Logging**: Unified try-catch blocks with console or file-based logs for critical failures.

## 5. Tech Stack & Tools

*   Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, shadcn/ui.
*   Backend: Next.js API routes & Server Actions, Node.js, Drizzle ORM, PostgreSQL.
*   Authentication: Better Auth for session management and RBAC.
*   MikroTik Integration: Custom `/lib/mikrotik.ts` module leveraging fetch or an NPM package (e.g., `node-routeros-rest`).
*   Deployment: Vercel (preferred) or Docker containers for custom infrastructure.
*   IDE & Plugins: VS Code with Tailwind CSS IntelliSense, Drizzle ORM snippets, ESLint, Prettier.

## 6. Non-Functional Requirements

*   **Performance**: 90th percentile page response under 300 ms; DB queries under 100 ms.
*   **Scalability**: Support up to thousands of client records and concurrent users.
*   **Security**: HTTPS everywhere, OWASP Top 10 considerations, secure storage of environment variables.
*   **Reliability**: Graceful error handling for partial failures (DB vs. Router API).
*   **Usability**: Accessible UI (ARIA roles, keyboard navigable), mobile-responsive layouts.
*   **Compliance**: GDPR-ready data handling; all personal data stored securely.

## 7. Constraints & Assumptions

*   The MikroTik router runs RouterOS v7 with REST API enabled and reachable from the backend.
*   Environment variables (`DATABASE_URL`, `AUTH_SECRET`, `ROUTER_HOST`, `ROUTER_USER`, `ROUTER_PASS`) are properly configured before launch.
*   The team uses Vercel for deployment; Docker setup is optional but available.
*   No existing billing or monitoring services need to integrate in v1.
*   All staff have modern browsers; no legacy IE support required.

## 8. Known Issues & Potential Pitfalls

*   **Partial Failure Handling**: If the database record is created but the router call fails, you must implement compensating transactions or rollback logic.
*   **API Rate Limits**: MikroTik devices may throttle repeated REST calls; add retry logic with exponential backoff.
*   **Schema Migrations**: Drizzle ORM migrations must be tested in staging before production rollout to avoid data loss.
*   **Network Connectivity**: The portal backend and router must be on a network path; errors in connectivity should surface clear errors to the user.
*   **RBAC Ambiguities**: Define clearly which API routes and UI elements are visible/editable by each role to avoid privilege leaks.

This PRD serves as the single source of truth for the AI model to generate detailed technical documents (Tech Stack, Frontend Guidelines, Backend Structure, App Flow, File Structure, IDE Rules, etc.) without ambiguity.
