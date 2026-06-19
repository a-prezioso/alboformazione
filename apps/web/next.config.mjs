import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.resolve(__dirname, '../..'),
  // PGlite (embedded local DB) ships WASM/FS assets it loads at runtime; let it
  // resolve from node_modules instead of being bundled, or the loader throws
  // "path argument must be ... Received an instance of URL".
  serverExternalPackages: ['@electric-sql/pglite'],
  experimental: {
    serverActions: {
      bodySizeLimit: '300mb',
      // Behind Cloudflare Tunnel → Traefik → oauth2-proxy the request Host can
      // differ from the browser Origin; Next 15 would otherwise reject Server
      // Actions (CSRF check) → backoffice forms silently fail in production.
      allowedOrigins: ['alboformazione.elitesoftwarehouse.com', '*.elitesoftwarehouse.com']
    }
  },
  poweredByHeader: false,
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
