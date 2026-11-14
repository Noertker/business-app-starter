import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Content Security Policy: tells the browser which sources it may load code and
// data from. Scripts may only come from this site, and the browser may only send
// data back to this site, so injected code can't load attacker scripts or leak data.
//
// Why 'unsafe-inline' for scripts: Next.js streams page data through small inline
// scripts. The stricter alternative (per-request nonces) disables the static/partial
// prerendering this app uses, and hash-based SRI doesn't cover inline scripts
// (we tested it: the dashboard stops loading). This is the policy Next.js
// recommends for apps without nonces. React's automatic escaping is the main XSS defence.
//
// ✏️ Adding a third-party script, image host or API called from the browser?
//    Add its domain to the matching line below.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  // Checkout and the billing portal are Stripe-hosted pages we redirect to.
  "form-action 'self' https://checkout.stripe.com https://billing.stripe.com",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  // HTTPS-only for 1 year, for this hostname only. Deliberately no
  // includeSubDomains/preload: those affect every subdomain and are hard to undo.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
