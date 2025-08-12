export function formatLocalDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayLocalString(): string {
  return formatLocalDateYYYYMMDD(new Date());
}

export function tomorrowLocalString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return formatLocalDateYYYYMMDD(d);
}

export function formatDuration(ms: number): string {
  const safe = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safe / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
}

