"use client";

import { IconHeart } from "@/components/layout/header/icons";

type WishlistHeartButtonProps = {
  saved: boolean;
  pending?: boolean;
  onToggle: () => void;
  className?: string;
  ariaLabel?: string;
};

export function WishlistHeartButton({
  saved,
  pending = false,
  onToggle,
  className = "",
  ariaLabel,
}: WishlistHeartButtonProps) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onToggle();
      }}
      disabled={pending}
      aria-pressed={saved}
      aria-label={ariaLabel ?? (saved ? "Remove from favourites" : "Save to favourites")}
      className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-sepia-border/80 bg-paper-light/95 text-ink shadow-sm transition hover:border-ink disabled:opacity-60 ${className}`}
    >
      <span className={saved ? "text-seal-wax" : "text-ink"}>
        <IconHeart />
      </span>
      {saved ? (
        <span className="pointer-events-none absolute h-4 w-4 rounded-full bg-seal-wax/10" aria-hidden="true" />
      ) : null}
    </button>
  );
}
