/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ["@supabase/supabase-js", "resend"],
  },
};

module.exports = nextConfig;
