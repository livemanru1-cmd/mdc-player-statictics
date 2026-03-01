const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ""

const normalizedBasePath =
  rawBasePath === "/"
    ? ""
    : rawBasePath.endsWith("/")
      ? rawBasePath.slice(0, -1)
      : rawBasePath

export function getBasePath(): string {
  return normalizedBasePath
}

export function withBasePath(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${normalizedBasePath}${normalizedPath}`
}
