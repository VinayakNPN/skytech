"use client";

import { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/contexts/AuthContext";
import { API_BASE_URL } from "@/config/api";
import Image from "next/image";
import logoImg from "../../../public/logo.png";
import "./login.css";

type LoginState =
  | "idle"
  | "loading"
  | "pending_approval"
  | "rejected"
  | "error";

export default function LoginPage() {
  const { login } = useAuth();
  const [state, setState] = useState<LoginState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [pendingUser, setPendingUser] = useState<{ name: string; email: string; avatarUrl: string | null } | null>(null);

  /**
   * Called by Google after the user consents.
   * We receive an authorization `code` (not an access token — that stays server-side).
   */
  const handleGoogleCode = async (code: string) => {
    setState("loading");
    setErrorMsg("");

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/google/callback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: window.location.origin,
        }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // ✅ Successful login
        login(data.token, data.user);
        return;
      }

      // 403 → check specific code
      if (res.status === 403) {
        if (data.code === "PENDING_APPROVAL") {
          setState("pending_approval");
          setPendingUser({
            name: data.name || "",
            email: data.email || "",
            avatarUrl: data.avatarUrl || null
          });
          return;
        }
        // Rejected or inactive
        setState("rejected");
        setErrorMsg(data.error || "Access denied. Contact your administrator.");
        return;
      }

      // Any other error
      setState("error");
      setErrorMsg(data.error || "Authentication failed. Please try again.");
    } catch (err: any) {
      setState("error");
      setErrorMsg("Network error. Please check your connection and try again.");
    }
  };

  const googleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (response) => {
      await handleGoogleCode(response.code);
    },
    onError: (error) => {
      setState("error");
      setErrorMsg("Google sign-in was cancelled or failed. Please try again.");
      console.error("Google OAuth error:", error);
    },
  });

  const isLoading = state === "loading";

  return (
    <div className="login-page-wrapper">
      <div className="login-card-container">

        {/* Left Side: Logo + Sign In Header + Google Auth Button */}
        <div className="form-container">
          <form onSubmit={(e) => { e.preventDefault(); }} suppressHydrationWarning>
            <Image
              src={logoImg}
              alt="SkyTech Logo"
              className="h-14 w-auto object-contain mb-4 mx-auto"
              priority
            />

            <h1 className="text-2xl font-bold text-slate-800 tracking-tight mb-4">Sign In</h1>

            {/* ── Idle / Loading state: show the Google button ── */}
            {(state === "idle" || state === "loading" || state === "error") && (
              <>
                <button
                  type="button"
                  onClick={() => googleLogin()}
                  disabled={isLoading}
                  className="google-auth-btn"
                  suppressHydrationWarning
                >
                  {/* Google "G" logo */}
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>{isLoading ? "Signing in…" : "Continue with Google"}</span>
                </button>

                {state === "error" && (
                  <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600 font-medium text-center">
                    {errorMsg}
                  </div>
                )}
              </>
            )}

            {/* ── Pending approval state ── */}
            {state === "pending_approval" && (
              <div className="mt-4 flex flex-col items-center gap-3">
                {pendingUser?.avatarUrl ? (
                  <img
                    src={pendingUser.avatarUrl}
                    alt="Avatar"
                    className="w-14 h-14 rounded-full border-2 border-amber-300 object-cover shadow-sm"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                )}
                
                <p className="text-sm font-semibold text-slate-700 text-center">
                  Waiting for Admin Approval
                </p>

                {pendingUser && (
                  <div className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col items-center">
                    <span className="text-xs font-bold text-slate-800 text-center truncate max-w-full">
                      {pendingUser.name}
                    </span>
                    <span className="text-[10px] text-slate-500 text-center truncate max-w-full">
                      {pendingUser.email}
                    </span>
                    <span className="mt-1.5 px-2 py-0.5 bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-600 rounded-full">
                      Pending Request
                    </span>
                  </div>
                )}

                <p className="text-xs text-slate-500 text-center leading-relaxed">
                  Your account is pending approval. The administrator has been notified and will grant you access shortly.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setState("idle");
                    setPendingUser(null);
                  }}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  ← Try a different account
                </button>
              </div>
            )}

            {/* ── Rejected state ── */}
            {state === "rejected" && (
              <div className="mt-4 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                </div>
                <p className="text-sm font-semibold text-slate-700 text-center">Access Denied</p>
                <p className="text-xs text-slate-500 text-center leading-relaxed">{errorMsg}</p>
                <button
                  type="button"
                  onClick={() => setState("idle")}
                  className="mt-2 text-xs text-blue-600 hover:underline"
                >
                  ← Try a different account
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Side: Static Curved Gradient Panel */}
        <div className="toggle-container">
          <div className="toggle">
            <div className="toggle-panel toggle-right">
              <h1 className="text-2xl font-bold mb-2">Welcome to Skytech!</h1>
              <p className="text-sm text-slate-200 leading-relaxed">
                Please sign in to view project insights and manage manufacturing workflows
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
