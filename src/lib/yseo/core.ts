export function makeStableId(...parts: Array<string | number>) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() - days);
  return next;
}

export function getRangeWindow(days: number) {
  const end = subtractDays(new Date(), 1);
  const start = subtractDays(end, days - 1);

  return {
    since: formatDate(start),
    until: formatDate(end),
  };
}

export function getPreviousRangeWindow(days: number) {
  const current = getRangeWindow(days);
  const currentStart = new Date(`${current.since}T00:00:00.000Z`);
  const end = subtractDays(currentStart, 1);
  const start = subtractDays(end, days - 1);

  return {
    since: formatDate(start),
    until: formatDate(end),
  };
}

export function percentDelta(current: number, previous: number) {
  if (previous <= 0) {
    return null;
  }

  return Number((((current - previous) / previous) * 100).toFixed(1));
}
