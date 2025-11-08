# ISP Manager App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new staff member first arrives, they see a landing page that highlights the ISP management portal and prompts them to log in or create an account. Choosing to sign up opens the registration page where they enter their work email, choose a secure password, and confirm their details. After submitting the form, they receive an email with a link to verify their address. Once verified, they are automatically signed in and taken to the dashboard. Returning staff can click the sign-in link on the landing page to enter their email and password. If they forget their password, there is a “Forgot Password” link that leads to a page where they enter their email. They receive a reset link by email, and clicking it brings them to a page to create a new password. After resetting, they are redirected to the login page. At any point, a signed-in user can find a log out button in the application header to end their session and return to the landing page.

## Main Dashboard or Home Page

After signing in, the user lands on the main dashboard. At the top, a header displays the application name on the left and the user profile menu on the right. Along the left side, a collapsible sidebar shows navigation links for Clients, Inventory, Employees, Bandwidth Plans, and Settings. The central area shows summary widgets such as total clients, active sessions, and inventory alerts. Each widget can be clicked to navigate directly to its corresponding detailed section. The sidebar remains visible as users move through the app, giving quick access to every major management area. The header remains constant, providing access to profile settings and logout.

## Detailed Feature Flows and Page Transitions

### Client Management

Selecting Clients in the sidebar loads the clients list page. The page displays a data table of all PPPoE clients with columns for name, plan, status, and actions. Clicking the “Add Client” button opens a modal or separate page with a form. The form asks for the client’s personal details, chosen bandwidth plan from a dropdown, and desired PPPoE username and password. Submitting triggers a server action that first writes the new record to PostgreSQL via Drizzle ORM and then calls the MikroTik API module to create the user on the router. When both operations succeed, the modal closes and the table refreshes to show the new client. To edit a client, the user clicks the edit icon in the client’s row, which opens a pre-filled form. Saving changes updates both the database and the router. A delete icon offers a confirmation dialog. Confirming removal triggers a server action that deletes the record from the database and disables the user on the MikroTik router before updating the list.

### Inventory Management

Clicking Inventory in the sidebar navigates to the inventory page. Here a table lists inventory items along with categories, current stock levels, and status indicators. An “Add Item” button opens a form where the user enters item name, category, description, quantity, and location. Submitting the form writes the new inventory record to the database and returns to the table view with the new item highlighted. Each row has actions for editing or archiving an item. Editing opens a form that updates database fields. Archiving marks the item as inactive in the database after a confirmation prompt.

### Employee Management

When the user chooses Employees, they see a directory of staff accounts with columns for name, email, and role. An “Invite Employee” button opens a form where an admin enters the new employee’s email and assigns a role such as administrator or technician. Submitting the form sends an invitation link by email, and creates a pending user record in the database. When the invitee clicks the link, they complete the account setup with a password. Admins can change roles or deactivate accounts by editing each user. All changes use server actions to update the database and enforce role-based access control.

### Bandwidth Plan Management

The Bandwidth Plans page shows a list of available plans with speed limits and pricing. Users can add a new plan by clicking “New Plan,” filling out speed parameters and cost, and saving it. The plan appears in the list and becomes selectable when adding or editing clients.

### Navigation Between Sections

At any time, clicking a different link in the sidebar triggers a client-side route transition to the chosen page. The header and sidebar remain constant, ensuring the user does not lose context. Transitions are smooth, and loading states appear briefly when fetching data.

## Settings and Account Management

Under Settings in the sidebar, users find personal preferences and account settings. The personal information page lets them update their name and contact details. The password settings page requires the current password and new password fields to make changes. Notification preferences allow toggling email alerts for events like low inventory or new client connections. If the organization uses subscription billing for advanced features, a Billing page shows current plan, usage, and a button to upgrade or change the subscription. Completing changes returns the user to the Settings overview, and a link takes them back to the main dashboard.

## Error States and Alternate Paths

If users type incorrect credentials on the login page, an inline error message appears above the form fields. On the forgot password page, entering an unrecognized email shows a warning that no account matches that address. On any form submission, if required fields are missing or invalid, red validation messages appear next to each field. During server actions, network failures show a full-page error banner advising the user to check their connection and retry. If the MikroTik API call fails while adding a client, a modal error explains that the client was saved to the database but not to the router, and offers retry options or rollback. When a user’s session expires, any action triggers a redirect to the login page with a message that the session has ended.

## Conclusion and Overall App Journey

From the moment an employee accesses the landing page, they move through a clear sign-up and verification process into a protected dashboard built for ISP management tasks. The main dashboard provides an overview and persistent navigation. Within the dashboard, the user can manage PPPoE clients, inventory, employee accounts, and bandwidth plans through intuitive forms and tables. Settings pages let them adjust personal details and notification preferences without leaving the main layout. If errors occur, clear messages guide the user back on track. Throughout the process, server actions coordinate safe database writes and network configuration changes to the MikroTik router, ensuring the ISP portal remains synchronized and reliable for everyday operations.