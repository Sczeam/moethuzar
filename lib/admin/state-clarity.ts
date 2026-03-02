export type AdminStateTone = "neutral" | "info" | "success" | "warning" | "danger";

const ADMIN_STATE_TONE_CLASS: Record<AdminStateTone, string> = {
  neutral: "border-sepia-border bg-paper-light text-ink",
  info: "border-antique-brass/70 bg-antique-brass/10 text-ink",
  success: "border-emerald-300 bg-emerald-50 text-emerald-900",
  warning: "border-amber-500/60 bg-amber-100/70 text-amber-900",
  danger: "border-seal-wax/45 bg-seal-wax/10 text-seal-wax",
};

export function adminStateBadgeClass(tone: AdminStateTone): string {
  return `inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${ADMIN_STATE_TONE_CLASS[tone]}`;
}

export function adminSurfaceNoticeClass(tone: AdminStateTone): string {
  return `rounded-md border px-3 py-3 text-sm ${ADMIN_STATE_TONE_CLASS[tone]}`;
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
