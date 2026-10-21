"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) throw signInError;
      if (!data.session) {
        throw new Error("No session was created. Check whether email confirmation is required for this account.");
      }

      router.replace("/");
      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Could not sign in.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#151719] p-4">
      <section className="w-full max-w-md rounded-xl border border-[#2A2C30] bg-[#202326] p-6 shadow-sm sm:p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#F3EFE8]">Sign in to 5Reach</h1>
          <p className="mt-2 text-sm text-[#92979D]">Use your Supabase account to continue.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <p role="alert" className="rounded-lg border border-red-900/50 bg-red-950/40 p-3 text-sm text-red-300">
              {error}
            </p>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#F3EFE8]">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-[#2A2C30] bg-[#151719] px-3 py-2 text-sm text-[#F3EFE8] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E8793E]"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#F3EFE8]">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-[#2A2C30] bg-[#151719] px-3 py-2 text-sm text-[#F3EFE8] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#E8793E]"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !email.trim() || !password}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E8793E] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#d66a2f] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            Sign in
          </button>
        </form>
      </section>
    </main>
  );
}