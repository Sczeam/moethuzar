"use client";

const REGISTER_BENEFITS = [
  "Track current and past orders in one place.",
  "Save favourites and return to them faster.",
  "Check out faster on your next purchase.",
  "Get help with your orders more easily.",
];

export function RegisterBenefitsList() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal/70">
          Why create an account
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-ink">A smoother way to shop Moethuzar</h2>
      </div>

      <ul className="space-y-3 text-sm leading-6 text-charcoal">
        {REGISTER_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-3">
            <span
              aria-hidden="true"
              className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-antique-brass"
            />
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
