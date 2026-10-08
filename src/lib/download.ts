/** Hands a generated file to the browser's download flow. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Revoked on a later task, not right away: some browsers start reading the
  // URL only after the click handler has returned.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Today as `YYYY-MM-DD` in the viewer's own time zone, for file names. */
export function todayStamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}
