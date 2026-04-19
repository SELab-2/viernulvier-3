export function parseResourceId(resourceUrl: string): number {
  const match = resourceUrl.match(/\/(\d+)\/?$/);

  if (!match) {
    throw new Error(`Invalid resource URL: ${resourceUrl}`);
  }

  return Number(match[1]);
}
