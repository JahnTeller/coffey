import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bz27a8hb2v.ufs.sh",
        port: "",
        pathname: "/f/**",
      },
    ],
  },
};

export default nextConfig;
