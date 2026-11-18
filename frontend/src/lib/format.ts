/** Formats an ISO timestamp for tables, in the viewer's locale and time zone. */
export function formatDateTime(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function formatDate(iso?: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString(undefined, { dateStyle: "medium" });
}

/** "Amina Okafor", or the email when the user has no name. */
export function displayName(u: { first_name?: string; last_name?: string; email: string }): string {
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ");
  return name || u.email;
}
