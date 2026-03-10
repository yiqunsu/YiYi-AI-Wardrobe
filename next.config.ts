import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(self)",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js inline scripts + Google Fonts
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Supabase storage, Google Fonts, self-hosted assets
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      // Images: self, Supabase storage, data URIs, blob for clipboard
      "img-src 'self' data: blob: https://*.supabase.co https://*.supabase.in",
      // API calls: self + Supabase + Google APIs
      "connect-src 'self' https://*.supabase.co https://*.supabase.in https://generativelanguage.googleapis.com https://weather.googleapis.com https://places.googleapis.com wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
