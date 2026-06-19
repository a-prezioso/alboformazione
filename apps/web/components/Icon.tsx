/**
 * Inline line-icon set (stroke = currentColor), SSR-safe — no web components.
 * 20×20 viewBox, 1.6 stroke. Keep names stable: they are referenced by the
 * navigation config and across the app.
 */
import type { SVGProps } from 'react';

export type IconName =
  | 'dashboard'
  | 'catalog'
  | 'paths'
  | 'my-courses'
  | 'live'
  | 'libretto'
  | 'certificate'
  | 'cart'
  | 'extra'
  | 'account'
  | 'analytics'
  | 'content'
  | 'users'
  | 'verify'
  | 'report'
  | 'bell'
  | 'menu'
  | 'logout'
  | 'chevron-down'
  | 'lock'
  | 'check'
  | 'play'
  | 'close';

const P = ({ d }: { d: string }) => <path d={d} />;

const PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="2.5" y="2.5" width="6" height="6" rx="1.3" />
      <rect x="11.5" y="2.5" width="6" height="6" rx="1.3" />
      <rect x="2.5" y="11.5" width="6" height="6" rx="1.3" />
      <rect x="11.5" y="11.5" width="6" height="6" rx="1.3" />
    </>
  ),
  catalog: (
    <>
      <P d="M3 4.5A1.5 1.5 0 0 1 4.5 3H9v14H4.5A1.5 1.5 0 0 1 3 15.5z" />
      <P d="M17 4.5A1.5 1.5 0 0 0 15.5 3H11v14h4.5A1.5 1.5 0 0 0 17 15.5z" />
    </>
  ),
  paths: (
    <>
      <circle cx="5" cy="5" r="2" />
      <circle cx="15" cy="15" r="2" />
      <P d="M7 5h5a3 3 0 0 1 0 6H8a3 3 0 0 0 0 6h5" />
    </>
  ),
  'my-courses': (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <P d="M8 7l5 3-5 3z" />
    </>
  ),
  live: (
    <>
      <rect x="2.5" y="5" width="10" height="10" rx="1.5" />
      <P d="M12.5 8.5l5-2.5v8l-5-2.5z" />
    </>
  ),
  libretto: (
    <>
      <rect x="4" y="2.5" width="12" height="15" rx="1.5" />
      <P d="M7 6h6M7 9h6M7 12h4" />
    </>
  ),
  certificate: (
    <>
      <circle cx="10" cy="8" r="5" />
      <P d="M7.5 12.5L6.5 18l3.5-2 3.5 2-1-5.5" />
    </>
  ),
  cart: (
    <>
      <P d="M2.5 3h2l1.5 9h8l1.5-6H6" />
      <circle cx="8" cy="16" r="1.2" />
      <circle cx="14" cy="16" r="1.2" />
    </>
  ),
  extra: (
    <>
      <P d="M10 2.5l1.8 4.2 4.2 1.8-4.2 1.8L10 14.5 8.2 10.3 4 8.5l4.2-1.8z" />
    </>
  ),
  account: (
    <>
      <circle cx="10" cy="7" r="3.2" />
      <P d="M4 16.5a6 6 0 0 1 12 0" />
    </>
  ),
  analytics: (
    <>
      <P d="M3 17h14" />
      <P d="M6 17V9M10 17V4M14 17v-5" />
    </>
  ),
  content: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="1.6" />
      <P d="M3 8h14M8 8v9" />
    </>
  ),
  users: (
    <>
      <circle cx="7.5" cy="7" r="2.6" />
      <P d="M2.5 16a5 5 0 0 1 10 0" />
      <P d="M13 5.2a2.6 2.6 0 0 1 0 5M14.5 16a5 5 0 0 0-3-4.6" />
    </>
  ),
  verify: (
    <>
      <P d="M10 2.5l6 2.2v4.6c0 4-2.6 6.7-6 8.2-3.4-1.5-6-4.2-6-8.2V4.7z" />
      <P d="M7.3 9.8l2 2 3.4-3.6" />
    </>
  ),
  report: (
    <>
      <P d="M5 2.5h6l4 4v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z" />
      <P d="M11 2.5V7h4M7 11h6M7 14h6" />
    </>
  ),
  bell: (
    <>
      <P d="M6 8a4 4 0 0 1 8 0c0 4 1.5 5 1.5 5h-11S6 12 6 8z" />
      <P d="M8.5 16a1.5 1.5 0 0 0 3 0" />
    </>
  ),
  menu: <P d="M3 5h14M3 10h14M3 15h14" />,
  logout: (
    <>
      <P d="M8 3H4.5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1H8" />
      <P d="M12 6l4 4-4 4M16 10H7" />
    </>
  ),
  'chevron-down': <P d="M5 7.5l5 5 5-5" />,
  lock: (
    <>
      <rect x="4" y="8.5" width="12" height="8" rx="1.5" />
      <P d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5" />
    </>
  ),
  check: <P d="M4 10.5l4 4 8-9" />,
  play: <P d="M6 4.5l9 5.5-9 5.5z" />,
  close: <P d="M5 5l10 10M15 5L5 15" />
};

export function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
