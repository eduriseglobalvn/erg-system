export function SparkleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z" />
      <path d="m19 14 0.8 2.2 2.2 0.8-2.2 0.8L19 20l-0.8-2.2-2.2-0.8 2.2-0.8L19 14Z" />
      <path d="m5 14 0.8 2.2 2.2 0.8-2.2 0.8L5 20l-0.8-2.2-2.2-0.8 2.2-0.8L5 14Z" />
    </svg>
  );
}

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path fill="#4285F4" d="M21.8 12.23c0-.75-.07-1.47-.2-2.16H12v4.1h5.48a4.68 4.68 0 0 1-2.03 3.06v2.54h3.28c1.92-1.77 3.07-4.38 3.07-7.54Z" />
      <path fill="#34A853" d="M12 22c2.76 0 5.08-.91 6.77-2.46l-3.28-2.54c-.91.61-2.07.98-3.49.98-2.68 0-4.94-1.81-5.75-4.24H2.86v2.62A10.23 10.23 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.25 13.74A6.15 6.15 0 0 1 5.93 12c0-.61.11-1.19.32-1.74V7.64H2.86A10.23 10.23 0 0 0 1.77 12c0 1.65.4 3.2 1.09 4.36l3.39-2.62Z" />
      <path fill="#EA4335" d="M12 6.02c1.5 0 2.84.52 3.89 1.52l2.92-2.92C17.07 2.99 14.76 2 12 2 7.97 2 4.48 4.3 2.86 7.64l3.39 2.62c.8-2.43 3.07-4.24 5.75-4.24Z" />
    </svg>
  );
}

export function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
      <path d="M16.7 12.7c0-2.4 2-3.6 2-3.7-1.1-1.6-2.9-1.8-3.5-1.8-1.5-.2-2.9.9-3.7.9-.8 0-1.9-.9-3.2-.8-1.6 0-3.1.9-3.9 2.4-1.7 3-.4 7.4 1.2 9.7.8 1.1 1.7 2.4 2.9 2.4 1.1 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-.9 2.8-2 .9-1.3 1.3-2.6 1.3-2.7-.1 0-2.5-1-2.5-4.4Zm-2.5-7c.7-.9 1.2-2.1 1.1-3.3-1.1 0-2.4.7-3.2 1.6-.7.8-1.3 2-1.1 3.2 1.2.1 2.4-.6 3.2-1.5Z" />
    </svg>
  );
}

export function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="5 12.5 9.5 17 19 7.5" />
    </svg>
  );
}

export function EyeIcon({ open }: { open: boolean }) {
  if (!open) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 3l18 18" />
        <path d="M10.6 10.7A3 3 0 0 0 13.3 13.4" />
        <path d="M9.4 5.5A10.8 10.8 0 0 1 12 5.2c6 0 9.5 6.8 9.5 6.8a15.2 15.2 0 0 1-3 3.8" />
        <path d="M6.2 6.3A15.3 15.3 0 0 0 2.5 12s3.5 6.8 9.5 6.8a10.9 10.9 0 0 0 4-.8" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 12s3.5-6.8 9.5-6.8 9.5 6.8 9.5 6.8-3.5 6.8-9.5 6.8S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
