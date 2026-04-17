"use client";

import { useState } from "react";
import { Mail, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function LoginView() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const addr = email.trim();
    if (!addr || status === "sending") return;
    setStatus("sending");
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    setStatus("sent");
  };

  return (
    <section className="px-5 py-12 space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-semibold text-ink-700">Sign in</h2>
        <p className="text-sm text-ink-500">
          We&apos;ll email you a link to sign in. No password.
        </p>
      </div>

      {status === "sent" ? (
        <div className="card p-5 text-center space-y-2">
          <Mail className="mx-auto text-accent" size={32} />
          <p className="text-ink-700 font-medium">Check your email</p>
          <p className="text-sm text-ink-500">
            We sent a magic link to <span className="italic">{email}</span>. Open it on any
            device to sign in.
          </p>
          <button
            onClick={() => {
              setStatus("idle");
              setEmail("");
            }}
            className="btn-ghost text-xs mt-2"
          >
            Use a different email
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="card p-4 space-y-3">
          <label className="text-xs uppercase tracking-wide text-ink-400">Email</label>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="input"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={!email.trim() || status === "sending"}
            className="btn-primary w-full justify-center disabled:opacity-40"
          >
            {status === "sending" ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sending…
              </>
            ) : (
              <>
                <Mail size={16} /> Send me a magic link
              </>
            )}
          </button>
        </form>
      )}
    </section>
  );
}
