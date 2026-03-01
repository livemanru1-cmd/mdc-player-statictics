/** @type {import('next').NextConfig} */
const isStaticExport = process.env.STATIC_EXPORT === "true"
const inferredRepositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? ""
const inferredBasePath = inferredRepositoryName ? `/${inferredRepositoryName}` : ""
const configuredBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isStaticExport ? inferredBasePath : "")
const normalizedBasePath =
  configuredBasePath === "/" ? "" : configuredBasePath.endsWith("/") ? configuredBasePath.slice(0, -1) : configuredBasePath

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: normalizedBasePath,
  },
  ...(isStaticExport
    ? {
        output: "export",
        trailingSlash: true,
        basePath: normalizedBasePath,
        assetPrefix: normalizedBasePath || undefined,
      }
    : {}),
}

export default nextConfig
