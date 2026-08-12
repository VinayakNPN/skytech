# Google Authentication Implementation Plan

This plan details the steps required to implement Google Authentication in both the Google Cloud Console and the existing SkyTech application (Frontend and Backend).

## User Review Required

> [!IMPORTANT]
> Please review this plan. Integrating Google Auth requires creating real credentials on Google Cloud. You will need a Google Cloud account to complete Step 1.
> Once you approve, I will proceed with writing the code for Step 2 and Step 3.

## Open Questions
- Do you already have a Google Cloud Project created, or will you be creating one from scratch?
- Should any person with a Google account be allowed to log in (and automatically create a new Employee profile), or should we only allow Google login if their email already exists in the `Employee` database?

## Phase 1: Google Cloud Setup (Manual Steps for You)

Before we can write the code, we need a **Client ID** from Google. Here are the steps to get one:

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new Project (e.g., "SkyTech ERP").
3. Navigate to **APIs & Services** > **OAuth consent screen**.
   - Choose **External** (or Internal if you have a Google Workspace).
   - Fill in the App Name ("SkyTech ERP"), User support email, and Developer contact information.
   - Save and Continue through the Scopes and Test users screens.
4. Navigate to **APIs & Services** > **Credentials**.
   - Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   - Application type: **Web application**.
   - Name: "Next.js Frontend".
   - **Authorized JavaScript origins**: Add `http://localhost:3000` (for local development).
   - **Authorized redirect URIs**: Add `http://localhost:3000` (for local development).
   - Click **Create**.
5. Copy the **Client ID** and **Client Secret**. We will need these for our environment files.

## Phase 2: Backend Implementation (Express & Prisma)

We will set up an endpoint to verify the Google Token and map it to an `Employee` in the database.

### 1. Install Dependencies
```bash
npm install google-auth-library jsonwebtoken
npm install -D @types/jsonwebtoken
```

### 2. Environment Variables
Add the following to `Backend/.env`:
```env
GOOGLE_CLIENT_ID="your_google_client_id_here"
JWT_SECRET="your_secure_jwt_secret_here"
```

### 3. [NEW] Auth Route (`Backend/src/routes/auth.ts`)
Create a new route to handle Google login:
- Receive the Google JWT from the frontend.
- Verify the token using `google-auth-library`.
- Extract the user's `email` and `name`.
- Check if the `Employee` exists in Prisma. (If not, we can either block them or create a new Employee entry).
- Generate a custom backend JWT and return it to the frontend.

## Phase 3: Frontend Implementation (Next.js)

We will use the `@react-oauth/google` library to handle the popup and token generation.

### 1. Install Dependencies
```bash
npm install @react-oauth/google
```

### 2. Environment Variables
Add the following to `Frontend/.env.local`:
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id_here"
```

### 3. Update Global Layout (`Frontend/src/app/layout.tsx`)
Wrap the application with the `GoogleOAuthProvider` so the Google scripts load correctly.

### 4. [MODIFY] Login Page 
Update your existing login page to use the `useGoogleLogin` hook or the `<GoogleLogin />` component.
- When the user clicks "Continue with Google", a popup will appear.
- On success, send the received `credential` to the new `POST /api/auth/google` backend endpoint.
- Store the returned backend JWT in `localStorage` or cookies.
- Redirect the user to the Dashboard (`/`).

---

**Once you review and approve this plan, I will immediately execute Phase 2 and Phase 3 in the codebase!**
