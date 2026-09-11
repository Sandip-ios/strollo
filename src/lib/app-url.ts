// Single source of truth for building absolute links in emails/CTAs.
// process.env.APP_URL should be set per-environment (Netlify env vars);
// this fallback is the live production domain, not localhost — so a
// missing/misconfigured env var never silently leaks a localhost link
// into a real email sent to a customer.
export const APP_URL = process.env.APP_URL ?? "https://strollo.in";
