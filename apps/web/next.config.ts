import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@sakubun-zemi/schemas", "@sakubun-zemi/api"],
};

export default nextConfig;
