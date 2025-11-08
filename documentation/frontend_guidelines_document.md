# Frontend Guideline Document

This document outlines the frontend architecture, design principles, styling, component structure, state management, routing, performance optimizations, testing strategies, and an overall summary for the `isp-manager-fullstack` Next.js starter kit. It is written in everyday language to help anyone understand how the frontend is built, why we chose certain tools, and how it all fits together.

## 1. Frontend Architecture

### Overview
- **Framework**: Next.js with the App Router, giving you server-side rendering (SSR), static site generation (SSG), and backend API routes in the same project.
- **Language**: TypeScript, for clear, type-safe code that reduces runtime errors.
- **UI Library**: `shadcn/ui` – a set of unstyled, accessible React components you can style however you like.
- **Styling**: Tailwind CSS, offering utility classes to build designs quickly and consistently.

### How It Supports Scalability, Maintainability, and Performance
- **Scalability**: The App Router organizes pages and API routes in a predictable folder structure (`/app`), making it easy to add features (clients, inventory, employees).
- **Maintainability**: TypeScript and a component-based approach mean each UI piece lives in its own file. This reduces cross-module coupling and makes updates straightforward.
- **Performance**: Next.js automatically splits code by route, performs server-side rendering when needed, and optimizes assets (images, CSS) for faster load times.

## 2. Design Principles

### Key Principles
1. **Usability**: Interfaces are intuitive—forms use clear labels, tables include sorting/filtering, and dialogs guide users through workflows.
2. **Accessibility**: All components from `shadcn/ui` meet ARIA standards. We add semantic HTML, focus management, and keyboard navigation support.
3. **Responsiveness**: Layouts adapt from small mobile screens to large desktops using Tailwind’s responsive utilities (`sm:`, `md:`, `lg:`).

### Applying These Principles
- **Consistent Patterns**: Buttons, dialogs, and tables share the same spacing, typography, and color rules.
- **Error States**: Forms display inline errors, and server actions return clear feedback messages.
- **Focus Management**: Modals trap focus, and skip links help screen-reader users bypass navigation.

## 3. Styling and Theming

### Styling Approach
- **Utility-First**: Tailwind CSS classes are written directly in JSX (`className="p-4 rounded bg-primary hover:bg-primary-dark"`).
- **Custom Components**: We wrap Tailwind classes into reusable UI components (e.g., `<Button>`, `<Card>`).

### Theming
- Defined in `tailwind.config.js` under `theme.extend`:
  - **Colors**: Primary, secondary, accent, background, surface, error.
  - **Font Family**: Inter for modern readability.
  - **Shades**: Light and dark variants for hover, active, and disabled states.

### Visual Style
- **Overall Style**: Modern, flat design with subtle glassmorphism on dialog overlays (using `backdrop-blur`).
- **Glassmorphism**: Light card backgrounds with low-opacity white and a slight blur.

### Color Palette
- Primary: #1D4ED8 (blue) / #1E40AF (dark blue)
- Secondary: #64748B (slate gray)
- Accent: #F59E0B (amber)
- Background: #F8FAFC (light gray)
- Surface: #FFFFFF (white)
- Error: #DC2626 (red)

### Typography
- **Font**: Inter, with fallbacks `system-ui, sans-serif`.
- **Sizes**: `text-base` for body, `text-lg` for headings, `text-sm` for captions.

## 4. Component Structure

### Organization
- `/components/ui`: Generic, reusable UI building blocks (Buttons, Inputs, Tables).
- `/components/layout`: Layout components (Sidebar, Header, Footer).
- `/app/dashboard/...`: Page-specific components are colocated with routes.

### Reusability and Maintainability
- **Single Responsibility**: Each component does one thing (e.g., `DataTable` only renders data; it doesn’t fetch it).
- **Props and Slots**: Components accept props for flexibility and use `children` slots for custom content.
- **Folder by Feature**: Related components (e.g., client list, client form) live in the same subfolder under `/components` or `/app/dashboard/clients`.

## 5. State Management

### Approach
- **Server Actions**: Next.js App Router Server Actions handle CRUD operations (create, read, update, delete) securely on the server.
- **Local UI State**: React’s `useState` and `useReducer` for form inputs, modal toggles, and sort/filter states.
- **Global UI State**: React Context for cross-app concerns (e.g., theme mode, authenticated user info).
- **Data Fetching**: `fetch` hooks inside React components or the new `use` hook in Next.js for subscription to server data.

### Sharing State Across Components
- Context Provider at `/app/layout.tsx` wraps the entire dashboard to give all children access to user session and theme.
- Custom hooks (e.g., `useClients`, `useInventory`) encapsulate fetching logic and state handling.

## 6. Routing and Navigation

### Routing
- **Next.js App Router**: Folder-based routing under `/app`:
  - `/app/page.tsx` – Public landing page or login.
  - `/app/dashboard/layout.tsx` – Dashboard shell (protected).
  - `/app/dashboard/clients/page.tsx` – Clients list.
  - `/app/dashboard/clients/[id]/page.tsx` – Client detail/edit.

### Navigation
- **Sidebar**: Defined in `app-sidebar.tsx`, links to Clients, Inventory, Employees.
- **Link Component**: Use `next/link` for internal navigation.
- **Active State**: Tailwind classes change based on the current route (`router.pathname`).
- **Breadcrumbs**: Optional on detail pages to show navigation hierarchy.

## 7. Performance Optimization

### Key Strategies
- **Code Splitting**: Next.js automatically splits route code; dynamic imports for heavy components (`const Map = dynamic(() => import('react-map-gl'))`).
- **Lazy Loading**: Images and charts load only when in viewport (`next/image` with `loading="lazy"`).
- **Asset Optimization**: Tailwind’s purge removes unused CSS in production.
- **SSR & SSG**: Use server-side rendering for dashboard data or static generation for rarely changing pages.
- **Caching**: HTTP caching headers for static assets; revalidation settings on server actions.

### Impact
Faster initial page loads, lower bundle sizes, and a smoother experience when navigating between sections.

## 8. Testing and Quality Assurance

### Testing Strategies
1. **Unit Tests**: Jest + React Testing Library to test individual components (buttons, forms).
2. **Integration Tests**: Jest for API route tests and Drizzle ORM database interactions.
3. **End-to-End Tests**: Playwright or Cypress to simulate user flows (login, add client, edit inventory).

### Tools and Frameworks
- **Jest**: Snapshot testing, mocking, code coverage reports.
- **React Testing Library**: Render components and assert on DOM output.
- **Playwright**: Cross-browser testing, headless or headed runs.
- **ESLint & Prettier**: Enforce code style and catch issues early.

## 9. Conclusion and Overall Frontend Summary

This frontend setup leverages Next.js’s App Router, TypeScript, Tailwind CSS, and `shadcn/ui` to deliver a modern, scalable, and maintainable ISP management portal. By following these guidelines:
- Developers can quickly build new pages under the `/app` folder.
- UI remains consistent thanks to shared design tokens and Tailwind utilities.
- Server Actions and contextual state ensure secure, seamless data operations.
- Performance and accessibility best practices guarantee a fast and inclusive experience.

Unique aspects of this stack include its built-in full-stack flow (frontend pages coexisting with API routes), utility-first styling for rapid iteration, and the power of type-safe schemas in Drizzle ORM. Together, they form a rock-solid foundation for your ISP portal—so you can focus on the business logic that matters.