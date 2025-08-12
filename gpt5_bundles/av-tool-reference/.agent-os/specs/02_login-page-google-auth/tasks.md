# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/02_login-page-google-auth/spec.md

> Created: 2025-07-30
> Status: Paused – Google OAuth deferred

## Tasks

- [x] 1. **Setup `shadcn/ui` and Dependencies**
    - [x] 1.1 First, ensure you are in the project directory.
    - [x] 1.2 Initialize `shadcn/ui` using the CLI: `npx shadcn-ui@latest init`. Accept the defaults.
    - [x] 1.3 Install the `lucide-react` icon library: `npm install lucide-react`.
    - [x] 1.4 Add the `Button` component: `npx shadcn-ui@latest add button`.
    - [x] 1.5 Add the `Card` component: `npx shadcn-ui@latest add card`.
    - [x] 1.6 **Test:** Verify that the `components/ui` directory has been created and contains `button.tsx` and `card.tsx`.

- [x] 2. **Create the Login Page Route and UI**
    - [x] 2.1 Create the new route directory: `mkdir -p src/app/login`.
    - [x] 2.2 Create the page file: `touch src/app/login/page.tsx`.
    - [x] 2.3 Build the static UI for the login page using the `Card` and `Button` components. The page should feature the company name "Clearpoint Technology & Design" and a "Sign in with Google" button with a Google icon from `lucide-react`.
    - [x] 2.4 **Test:** Start the dev server and navigate to `http://localhost:3000/login`. Verify that the login page renders correctly and matches the professional, sleek design requirements.

- [x] 3. **Implement Google Authentication Logic**
    - [x] 3.1 Create a new client component (`src/components/auth/SignInButton.tsx`) to encapsulate the button and its logic, preventing the main login page from being a client component.
    - [x] 3.2 In this new component, create an `onClick` handler that calls our Supabase client: `supabase.auth.signInWithOAuth({ provider: 'google' })`.
    - [x] 3.3 Add basic error handling to log any issues to the console.
    - [x] 3.4 **Test:** Manually perform the end-to-end login flow. Click the button, authenticate with Google, and verify that you are successfully redirected to the application's dashboard (`/`).

- [x] 4. **Finalize Documentation**
    - [x] 4.1 Update the main `spec.md` with cross-references to all spec documents and this task list.
    - [x] 4.2 Add a new entry to `development-log.md` summarizing the completion of this spec.
    - [x] 4.3 **Test:** Confirm that all spec documentation is linked and the development log is updated correctly.