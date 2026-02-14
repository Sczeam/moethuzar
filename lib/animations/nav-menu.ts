export const NAV_MENU_ANIMATION = {
  overlay: {
    duration: 0.2,
    easeIn: "power1.in",
    easeOut: "power1.out",
  },
  panel: {
    openX: 0,
    closedX: 24,
    durationOpen: 0.28,
    durationClose: 0.18,
    easeIn: "power1.in",
    easeOut: "power2.out",
  },
  links: {
    openX: 0,
    closedX: 8,
    durationOpen: 0.2,
    durationClose: 0.12,
    staggerOpen: 0.04,
    staggerClose: 0.02,
    delayOpen: 0.06,
    easeIn: "power1.in",
    easeOut: "power2.out",
  },
} as const;
