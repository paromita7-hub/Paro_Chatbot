"use client";

import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "paro:user-id";

/**
 * V1 has no login flow. We generate a stable UUID per browser and persist
 * it in localStorage, sent as the `X-User-Id` header on every request. This
 * keeps the User -> Conversation -> Message data model real today, and can
 * be swapped for real auth later without touching the rest of the app.
 */
export function useUserId(): string | null {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      existing = uuidv4();
      localStorage.setItem(STORAGE_KEY, existing);
    }
    setUserId(existing);
  }, []);

  return userId;
}
