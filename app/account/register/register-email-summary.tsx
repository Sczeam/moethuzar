"use client";

type RegisterEmailSummaryProps = {
  email: string;
  onEdit: () => void;
};

export default function RegisterEmailSummary({
  email,
  onEdit,
}: RegisterEmailSummaryProps) {
  return (
    <div className="mb-8 border border-sepia-border bg-paper-light px-4 py-4 sm:px-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-charcoal/65">
            Creating account for
          </p>
          <p className="mt-2 text-base text-ink">{email}</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="text-sm underline decoration-sepia-border underline-offset-4 hover:text-ink"
        >
          Edit
        </button>
      </div>
    </div>
  );
}
