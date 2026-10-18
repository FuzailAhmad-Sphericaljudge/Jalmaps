export type TimeRangePreset = "24h" | "7d" | "30d" | "kharif" | "rabi" | "zaid" | "1y" | "custom";

export interface TimeRange {
  from: Date;
  to: Date;
  preset: TimeRangePreset;
}

export function getRangePreset(preset: TimeRangePreset, now: Date = new Date()): TimeRange {
  const to = new Date(now.getTime());
  const from = new Date(now.getTime());

  switch (preset) {
    case "24h":
      from.setHours(from.getHours() - 24);
      break;
    case "7d":
      from.setDate(from.getDate() - 7);
      break;
    case "30d":
      from.setDate(from.getDate() - 30);
      break;
    case "1y":
      from.setFullYear(from.getFullYear() - 1);
      break;
    case "kharif":
      // June 1 to Oct 31
      from.setMonth(5, 1);
      from.setHours(0, 0, 0, 0);
      to.setMonth(9, 31);
      to.setHours(23, 59, 59, 999);
      if (now.getMonth() < 5) {
        from.setFullYear(from.getFullYear() - 1);
        to.setFullYear(to.getFullYear() - 1);
      }
      break;
    case "rabi":
      // Nov 1 to Mar 31
      from.setMonth(10, 1);
      from.setHours(0, 0, 0, 0);
      to.setMonth(2, 31);
      to.setHours(23, 59, 59, 999);
      if (now.getMonth() < 10 && now.getMonth() > 2) {
        from.setFullYear(from.getFullYear() - 1);
        to.setFullYear(to.getFullYear() - 1); // Mar 31 of current year, Nov 1 of prev year
      } else if (now.getMonth() >= 10) {
        to.setFullYear(to.getFullYear() + 1); // Mar 31 of next year, Nov 1 of current year
      } else {
        from.setFullYear(from.getFullYear() - 1); // Mar 31 of current year, Nov 1 of prev year
      }
      break;
    case "zaid":
      // Apr 1 to May 31
      from.setMonth(3, 1);
      from.setHours(0, 0, 0, 0);
      to.setMonth(4, 31);
      to.setHours(23, 59, 59, 999);
      if (now.getMonth() < 3) {
        from.setFullYear(from.getFullYear() - 1);
        to.setFullYear(to.getFullYear() - 1);
      }
      break;
    case "custom":
      break;
  }

  // Cap 'to' at 'now'
  if (to > now) {
    to.setTime(now.getTime());
  }

  return { from, to, preset };
}
