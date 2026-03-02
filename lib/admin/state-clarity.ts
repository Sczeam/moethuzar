export type AdminStateTone = "neutral" | "info" | "success" | "warning" | "danger";

const ADMIN_STATE_TONE_CLASS: Record<AdminStateTone, string> = {
  neutral: "border-sepia-border bg-paper-light text-ink",
  info: "border-antique-brass/70 bg-antique-brass/10 text-ink",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-500/60 bg-amber-100/70 text-amber-900",
  danger: "border-seal-wax/45 bg-seal-wax/10 text-seal-wax",
};

const ADMIN_TEXT_TONE_CLASS: Record<AdminStateTone, string> = {
  neutral: "text-charcoal",
  info: "text-ink",
  success: "text-emerald-900",
  warning: "text-amber-900",
  danger: "text-seal-wax",
};

const ADMIN_PROGRESS_TONE_CLASS: Record<AdminStateTone, string> = {
  neutral: "bg-charcoal/35",
  info: "bg-antique-brass",
  success: "bg-emerald-600",
  warning: "bg-amber-600",
  danger: "bg-seal-wax",
};

export function adminStateToneClass(tone: AdminStateTone): string {
  return ADMIN_STATE_TONE_CLASS[tone];
}

export function adminStateBadgeClass(tone: AdminStateTone): string {
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${adminStateToneClass(tone)}`;
}

export function adminSurfaceNoticeClass(tone: AdminStateTone): string {
  return `rounded-md border px-3 py-3 text-sm ${adminStateToneClass(tone)}`;
}

export function adminInteractivePillClass({
  active,
  activeTone,
}: {
  active: boolean;
  activeTone: AdminStateTone;
}): string {
  if (active) {
    return `rounded-full border-2 border-ink px-3 text-sm font-semibold ${ADMIN_STATE_TONE_CLASS[activeTone]}`;
  }

  return "rounded-full border border-sepia-border bg-paper-light px-3 text-sm font-semibold text-charcoal";
}

export function adminDisabledControlClass(): string {
  return "opacity-60 cursor-not-allowed saturate-50";
}

export function adminStateTextClass(tone: AdminStateTone): string {
  return ADMIN_TEXT_TONE_CLASS[tone];
}

export function adminProgressFillClass(tone: AdminStateTone): string {
  return ADMIN_PROGRESS_TONE_CLASS[tone];
}

export function adminFieldInvalidClass(): string {
  return "border-seal-wax/70 ring-1 ring-seal-wax/25";
}
