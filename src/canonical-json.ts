/** Shared canonical ordering. This module contains no authority, keys or fixtures. */
export function toCanonicalValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(toCanonicalValue);
  if (typeof value !== "object" || value === null) return value;
  const output: Record<string, unknown> = {};
  for (const key of Object.keys(value).sort()) {
    const item = (value as Record<string, unknown>)[key];
    if (item !== undefined) Object.defineProperty(output, key, {
      value: toCanonicalValue(item), enumerable: true, writable: true, configurable: true,
    });
  }
  return output;
}
