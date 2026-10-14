import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.js");

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["192.168.1.83"],
  async redirects() {
    return [
      { source: "/en", destination: "/", permanent: false },
      { source: "/en/:path*", destination: "/", permanent: false },
      { source: "/admin/seed", destination: "/admin/content", permanent: false },
    ];
  },
};

export default withNextIntl(nextConfig);
