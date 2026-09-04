"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "laverie_access_ok";

export default function AccessGate({ children }: { children: React.ReactNode }) {
  const requiredCode = process.env.NEXT_PUBLIC_ACCESS_CODE;
  const [unlocked, setUnlocked] = useState(!requiredCode);
  const [checked, setChecked] = useState(false);
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);

  // Lecture de localStorage (indisponible côté serveur) : doit rester dans un
  // effet pour éviter un mismatch d'hydratation SSR/client.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!requiredCode) {
      setChecked(true);
      return;
    }
    if (localStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
    setChecked(true);
  }, [requiredCode]);
  /* eslint-enable react-hooks/set-state-in-effect */

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (input.trim().toLowerCase() === requiredCode?.toLowerCase()) {
      localStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (!checked) return null;

  if (unlocked) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-zinc-900">Accès résidence</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Entre le code communiqué dans la résidence pour accéder au planning.
        </p>
        <input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Code d'accès"
          className="mt-4 w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-sm outline-none focus:border-zinc-500"
        />
        {error && (
          <p className="mt-2 text-sm text-red-600">Code incorrect, réessaie.</p>
        )}
        <button
          type="submit"
          className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-700"
        >
          Valider
        </button>
      </form>
    </div>
  );
}
