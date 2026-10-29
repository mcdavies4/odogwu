
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminCallbackPage() {
  const [message, setMessage] = useState(
    "Verifying your administrator sign-in…"
  );

  useEffect(() => {
    let active = true;

    async function finishSignIn() {
      const hash = window.location.hash.startsWith("#")
        ? window.location.hash.slice(1)
        : window.location.hash;

      const params = new URLSearchParams(hash);
      const accessToken = params.get("access_token");
      const authError =
        params.get("error_description") ?? params.get("error");

      if (authError) {
        if (active) {
          setMessage(
            "The sign-in link is invalid or has expired. Please request a new one."
          );
        }
        return;
      }

      if (!accessToken) {
        if (active) {
          setMessage(
            "No sign-in token was found. Please return to admin login and request a new link."
          );
        }
        return;
      }

      try {
        const response = await fetch("/auth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ access_token: accessToken }),
        });

        if (!response.ok) {
          if (active) {
            setMessage(
              "This account could not be authorised for the admin area. Please check the admin configuration."
            );
          }
          return;
        }

        window.history.replaceState(
          null,
          "",
          window.location.pathname
        );

        window.location.replace("/admin");
      } catch {
        if (active) {
          setMessage(
            "We couldn't complete sign-in because of a connection problem. Please try again."
          );
        }
      }
    }

    void finishSignIn();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main
      className="wrap stack"
      style={{
        minHeight: "80dvh",
        display: "grid",
        alignContent: "center",
        maxWidth: 460,
      }}
    >
      <section className="panel stack" style={{ padding: 24 }}>
        <p className="small muted" style={{ margin: 0 }}>
          PRIVATE ADMIN AREA
        </p>

        <h1 style={{ fontSize: 28, margin: 0 }}>
          Completing sign-in
        </h1>

        <p role="status" aria-live="polite" className="muted">
          {message}
        </p>

        <Link href="/admin/login" className="btn">
          Return to admin login
        </Link>
      </section>
    </main>
  );
}
