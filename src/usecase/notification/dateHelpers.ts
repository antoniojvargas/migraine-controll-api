const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

export const getWeekStart = (date: Date): Date => {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  utcDate.setUTCDate(utcDate.getUTCDate() + diffToMonday);
  return utcDate;
};

export const getWeekKey = (date: Date): string => {
  const weekStart = getWeekStart(date);
  const year = weekStart.getUTCFullYear();
  const month = String(weekStart.getUTCMonth() + 1).padStart(2, '0');
  const day = String(weekStart.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const calculateAverageMigrainesPerWeek = (dates: Date[]): number => {
  if (dates.length === 0) {
    return 0;
  }
  const timestamps = dates.map((date) => date.getTime());
  const firstWeekStart = getWeekStart(new Date(Math.min(...timestamps))).getTime();
  const lastWeekStart = getWeekStart(new Date(Math.max(...timestamps))).getTime();
  const weekCount = Math.round((lastWeekStart - firstWeekStart) / MS_PER_WEEK) + 1;
  return dates.length / weekCount;
};
