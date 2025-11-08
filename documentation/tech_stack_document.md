# Tech Stack Document for isp-manager-fullstack

This document explains, in everyday language, the technology choices behind the `isp-manager-fullstack` starter kit. It shows how each part fits together to give you a solid foundation for building an ISP Management Portal.

## Frontend Technologies

We chose modern, widely adopted tools to build a fast, responsive, and easy-to-maintain user interface.

- **Next.js (App Router)**
  - Provides the framework for building React-based pages and layouts.
  - Offers built-in support for server-side rendering and client-side navigation, which keeps the app fast and SEO-friendly.
- **TypeScript**
  - Adds type checking to JavaScript, helping catch errors early.
  - Makes complex data models (like clients and inventory items) safer to work with.
- **shadcn/ui**
  - A collection of ready-made, accessible UI components (tables, forms, dialogs) that you can customize.
  - Speeds up building data-rich dashboards without being locked into one visual style.
- **Tailwind CSS**
  - A utility-first styling framework that allows you to build consistent, responsive interfaces with minimal custom CSS.
  - Its built-in purge feature keeps final CSS files small for better performance.

These tools work together to give you a clean, interactive dashboard that your staff can use on desktops and tablets alike.

## Backend Technologies

The backend powers your application’s data handling, authentication, and integration with network devices.

- **Next.js API Routes & Server Actions**
  - Let you write server-side functions right alongside your pages.
  - Keep sensitive logic (like database writes or router API calls) off the client.
- **better-auth**
  - Handles user registration, login, and session management.
  - Can be extended to support roles (e.g., admin, technician) for fine-grained access control.
- **PostgreSQL**
  - A reliable, open-source relational database for storing clients, inventory records, bandwidth plans, and employee profiles.
- **Drizzle ORM**
  - A type-safe way to define database schemas and run queries in TypeScript.
  - Ensures that your code matches the database structure, reducing runtime errors.
- **Custom MikroTik RouterOS Module**
  - Located in `/lib/mikrotik.ts`.
  - Contains functions (e.g., `createPppoeUser`, `disablePppoeUser`) that talk to your MikroTik devices via their REST API.

Together, these components let you securely manage data and push configuration changes to your MikroTik routers.

## Infrastructure and Deployment

A clear deployment setup ensures your app runs reliably in development and production.

- **Version Control (Git / GitHub)**
  - Keeps all code changes tracked and allows your team to collaborate safely.
- **Hosting on Vercel**
  - Seamless deployment of Next.js apps with minimal configuration.
  - Automatic previews for pull requests.
- **Docker Support**
  - Provides a consistent local environment for your team.
  - Makes it easy to containerize the app for other hosting options.
- **CI/CD Pipeline**
  - Vercel’s built-in pipeline (or GitHub Actions if preferred) to run tests, builds, and deployments automatically.
- **Vercel Cron Jobs (Optional)**
  - Schedule background tasks, such as syncing PPPoE user states or checking inventory levels.
- **Environment Variables**
  - Securely store sensitive values (`DATABASE_URL`, `AUTH_SECRET`, `MIKTROTIK_API_KEY`) outside of your codebase.

This setup lets you ship updates quickly while keeping the production site stable and secure.

## Third-Party Integrations

Integrations save you from reinventing the wheel and add powerful features:

- **better-auth**
  - Outsources user authentication and session handling.
- **MikroTik RouterOS REST API**
  - Direct integration with your network equipment for managing PPPoE users.
- **shadcn/ui**
  - Reinforces frontend development with tested UI building blocks.
- **Vercel Cron Jobs**
  - Optional service for scheduled scripts (inventory alerts, connection syncs).

Each integration extends the portal’s capabilities without complicating your core code.

## Security and Performance Considerations

We’ve built in best practices to keep your data safe and your app snappy:

- **Authentication & Role-Based Access Control**
  - All dashboard pages and API routes require a valid session.
  - You can define roles (admin, technician) to guard specific actions.
- **Server-Side Logic**
  - Sensitive operations (database writes, router calls) run on the server, not in the browser.
- **Environment Variables**
  - Secrets never appear in client code or version control.
- **Error Handling & Logging**
  - Wrap key operations (e.g., MikroTik calls) in try/catch blocks.
  - Log errors so you can detect when the database and router states diverge.
- **Performance Optimizations**
  - Next.js’s built-in code splitting and caching.
  - Tailwind’s purge feature to remove unused CSS.
  - TypeScript to catch errors at build time, reducing runtime overhead.

## Conclusion and Overall Tech Stack Summary

By combining Next.js, TypeScript, Tailwind CSS, shadcn/ui, PostgreSQL, Drizzle ORM, and better-auth, this starter kit gives you:

- A **modern, full-stack framework** that unifies frontend and backend code.
- A **secure authentication system** ready for role-based access.
- **Database integration** with strong typing and reliable migrations.
- A **custom module** for managing MikroTik RouterOS devices.
- **Easy deployment** on Vercel or any Docker-based environment.

This tech stack aligns with your goal of a scalable, maintainable ISP Management Portal. It frees you to focus on building the specific business logic—like detailed client management, inventory tracking, and employee workflows—without worrying about wiring up the essential infrastructure.