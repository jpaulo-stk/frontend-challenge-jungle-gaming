// Plain query strings (`?collection=musica&collection=jogos&page=2`) instead of
// the router's default JSON encoding. Every value is read as a string (or a
// string list when a key repeats); route schemas coerce the types.

export function parseSearch(searchStr: string): Record<string, unknown> {
  const params = new URLSearchParams(searchStr.startsWith("?") ? searchStr.slice(1) : searchStr);
  const search: Record<string, string | string[]> = {};
  for (const key of new Set(params.keys())) {
    const values = params.getAll(key);
    search[key] = values.length > 1 ? values : (values[0] ?? "");
  }
  return search;
}

export function stringifySearch(search: Record<string, unknown>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (value === undefined || value === null || value === "") continue;
    const values: unknown[] = Array.isArray(value) ? value : [value];
    for (const item of values) {
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        params.append(key, String(item));
      }
    }
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
