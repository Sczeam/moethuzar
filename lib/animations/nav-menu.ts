export const NAV_MENU_ANIMATION = {
  overlay: {
    duration: 0.18,
    easeIn: "power2.in",
    easeOut: "power2.out",
  },
  drawer: {
    openX: 0,
    closedXLeft: -24,
    closedXRight: 24,
    durationOpen: 0.3,
    durationClose: 0.24,
    easeIn: "power2.in",
    easeOut: "power3.out",
  },
} as const;
