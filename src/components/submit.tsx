"use client";
import { useFormStatus } from "react-dom";
export function Submit({
  children,
  pending = "Saving…",
  className = "btn btn-primary",
}: {
  children: React.ReactNode;
  pending?: string;
  className?: string;
}) {
  const { pending: busy } = useFormStatus();
  return (
    <button type="submit" disabled={busy} className={className}>
      {busy ? pending : children}
    </button>
  );
}
