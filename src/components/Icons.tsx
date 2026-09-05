import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement> & { size?: number };

const base = (props: P) => {
  const { size = 18, ...rest } = props;
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...rest,
  };
};

export const IconCart = (p: P) => (
  <svg {...base(p)}>
    <path d="M3 4h2.2l2.5 11.2a1.6 1.6 0 0 0 1.6 1.3h7.9a1.6 1.6 0 0 0 1.6-1.2L21 8H6" />
    <circle cx="10" cy="20" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
export const IconSearch = (p: P) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20.5 20.5-3.8-3.8" />
  </svg>
);
export const IconHeart = (p: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={p.filled ? "currentColor" : "none"}>
    <path d="M12 20.3 4.7 13a4.9 4.9 0 0 1 7-7l.3.4.3-.4a4.9 4.9 0 0 1 7 7Z" />
  </svg>
);
export const IconUser = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </svg>
);
export const IconStar = (p: P & { filled?: boolean }) => (
  <svg {...base(p)} fill={p.filled ? "currentColor" : "none"} strokeWidth={1.6}>
    <path d="m12 3.2 2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.6l6.1-.8Z" />
  </svg>
);
export const IconPlus = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconMinus = (p: P) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const IconX = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconCheck = (p: P) => (
  <svg {...base(p)}>
    <path d="m4.5 12.5 5 5L19.5 7" />
  </svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);
export const IconChevronRight = (p: P) => (
  <svg {...base(p)}>
    <path d="m9 6 6 6-6 6" />
  </svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 12h16m-6-6 6 6-6 6" />
  </svg>
);
export const IconArrowUpRight = (p: P) => (
  <svg {...base(p)}>
    <path d="M7 17 17 7M9 7h8v8" />
  </svg>
);
export const IconTrash = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m3 0-.8 12a1.6 1.6 0 0 1-1.6 1.5H8.4A1.6 1.6 0 0 1 6.8 19L6 7" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
export const IconEdit = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 20h8" />
    <path d="M16.5 3.9a2.1 2.1 0 0 1 3 3L8 18.4 4 19.5l1.1-4Z" />
  </svg>
);
export const IconBox = (p: P) => (
  <svg {...base(p)}>
    <path d="m12 2.5 8.5 4.9v9.2L12 21.5l-8.5-4.9V7.4Z" />
    <path d="m3.5 7.4 8.5 4.9 8.5-4.9M12 12.3v9.2" />
  </svg>
);
export const IconStore = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
    <path d="M3.4 6 5 3.5h14L20.6 6a2.6 2.6 0 1 1-5.2.4A2.6 2.6 0 1 1 12 6.7 2.6 2.6 0 1 1 8.6 6.4 2.6 2.6 0 1 1 3.4 6Z" />
    <path d="M9.5 20v-5.5h5V20" />
  </svg>
);
export const IconShield = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 2.8 5 5.4v6c0 4.6 3 7.9 7 9.8 4-1.9 7-5.2 7-9.8v-6Z" />
    <path d="m9 11.5 2.2 2.2L15.5 9" />
  </svg>
);
export const IconBug = (p: P) => (
  <svg {...base(p)}>
    <rect x="8" y="7" width="8" height="12" rx="4" />
    <path d="M9 8 7 5.5M15 8l2-2.5M9 12H4.5M19.5 12H15M9.5 17.5 6 20M14.5 17.5 18 20M12 3.5a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3Z" />
  </svg>
);
export const IconSettings = (p: P) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="3.2" />
    <path d="M19 12a7 7 0 0 0-.15-1.44l2-1.55-2-3.46-2.36.95a7 7 0 0 0-2.49-1.44L13.65 2.5h-3.3l-.35 2.56a7 7 0 0 0-2.49 1.44l-2.36-.95-2 3.46 2 1.55A7 7 0 0 0 5 12c0 .5.05.97.15 1.44l-2 1.55 2 3.46 2.36-.95a7 7 0 0 0 2.49 1.44l.35 2.56h3.3l.35-2.56a7 7 0 0 0 2.49-1.44l2.36.95 2-3.46-2-1.55c.1-.47.15-.95.15-1.44Z" />
  </svg>
);
export const IconLogout = (p: P) => (
  <svg {...base(p)}>
    <path d="M14 4h-8a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 20h8M10 12h10m-4-4 4 4-4 4" />
  </svg>
);
export const IconEye = (p: P & { off?: boolean }) => (
  <svg {...base(p)}>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
    {p.off && <path d="M4 4l16 16" />}
  </svg>
);
export const IconFilter = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </svg>
);
export const IconAlert = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3.5 22 20H2Z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.2" r="0.4" fill="currentColor" />
  </svg>
);
export const IconTruck = (p: P) => (
  <svg {...base(p)}>
    <path d="M2.5 6h11v11h-11zM13.5 10h4l3 3.5V17h-7" />
    <circle cx="6.5" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
  </svg>
);
export const IconPackage = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="7" width="17" height="13" rx="1.5" />
    <path d="M3.5 11h17M12 7v13M8 7l2-3h4l2 3" />
  </svg>
);
export const IconSpark = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
  </svg>
);
export const IconTag = (p: P) => (
  <svg {...base(p)}>
    <path d="m3.5 12.5 8-8H20v8.5l-8 8a1.8 1.8 0 0 1-2.5 0l-6-6a1.8 1.8 0 0 1 0-2.5Z" />
    <circle cx="16" cy="8" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
export const IconCard = (p: P) => (
  <svg {...base(p)}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19M6 14.5h4" />
  </svg>
);
export const IconRefresh = (p: P) => (
  <svg {...base(p)}>
    <path d="M20 12a8 8 0 1 1-2.34-5.66M20 3.5V8h-4.5" />
  </svg>
);
export const IconMenu = (p: P) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconDownload = (p: P) => (
  <svg {...base(p)}>
    <path d="M12 4v11m-4.5-4L12 15.5 16.5 11M4.5 19.5h15" />
  </svg>
);
export const IconGauge = (p: P) => (
  <svg {...base(p)}>
    <path d="M4.5 18a8.5 8.5 0 1 1 15 0" />
    <path d="m12 14 4-5" />
    <circle cx="12" cy="14.5" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);
export const IconImage = (p: P) => (
  <svg {...base(p)}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="1.6" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4.5 17.5 4.7-4.7 3.3 3.3 3-3 4 4" />
  </svg>
);
export const IconUsers = (p: P) => (
  <svg {...base(p)}>
    <circle cx="9" cy="8.5" r="3.5" />
    <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
    <path d="M15.5 5.6a3.5 3.5 0 0 1 0 5.8M17.5 14.6a6.5 6.5 0 0 1 4 5.4" />
  </svg>
);
export const IconReceipt = (p: P) => (
  <svg {...base(p)}>
    <path d="M6 3.5h12V20l-2.4-1.6L13.2 20l-2.4-1.6L8.4 20 6 18.4Z" transform="translate(0,0.5)" />
    <path d="M9 8h6M9 11.5h6M9 15h3.5" />
  </svg>
);
export const IconMegaphone = (p: P) => (
  <svg {...base(p)}>
    <path d="M3.5 10.5v3a1 1 0 0 0 1 1H7l10 4.5v-14L7 9.5H4.5a1 1 0 0 0-1 1Z" />
    <path d="M20.5 10a2.5 2.5 0 0 1 0 4M8 15l1 5h2.5l-.8-4.5" />
  </svg>
);

export const Logo = ({ size = 30 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
    <rect width="32" height="32" rx="7" fill="#0E5A47" />
    <rect x="5" y="6" width="4.4" height="12" fill="#F2A614" />
    <rect x="9.4" y="6" width="4.4" height="12" fill="#FBFAF5" />
    <rect x="13.8" y="6" width="4.4" height="12" fill="#F2A614" />
    <rect x="18.2" y="6" width="4.4" height="12" fill="#FBFAF5" />
    <rect x="22.6" y="6" width="4.4" height="12" fill="#F2A614" />
    <rect x="8" y="21" width="16" height="6" rx="1.5" fill="#FBFAF5" />
  </svg>
);
