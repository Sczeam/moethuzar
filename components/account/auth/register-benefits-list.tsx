"use client";

const REGISTER_BENEFITS = [
  "Track current and past orders in one place.",
  "Save favourites and return to them faster.",
  "Check out faster on your next purchase.",
  "Get help with your orders more easily.",
];

export function RegisterBenefitsList() {
  return (
    <div className="space-y-6">
      <p className="text-sm leading-7 text-charcoal">
        Enjoy a more complete shopping experience with your personal account.
      </p>

      <ul className="space-y-4 text-sm leading-7 text-charcoal">
        {REGISTER_BENEFITS.map((benefit) => (
          <li key={benefit} className="flex items-start gap-4">
            <span
              aria-hidden="true"
              className="mt-[0.22rem] inline-flex h-7 w-7 flex-none items-center justify-center border border-sepia-border text-[0.8rem] text-antique-brass"
            >
              +
            </span>
            <span>{benefit}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
