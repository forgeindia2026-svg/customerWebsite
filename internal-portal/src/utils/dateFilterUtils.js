// Helper utility to filter items by date range (Today, This Week, This Month, Last Month, This Year, All Time)

export const isDateInRange = (dateInput, range) => {
  if (!range || range === 'All Time') return true;
  if (!dateInput) return false;

  let d = null;
  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (trimmed.toLowerCase().includes('today')) {
      if (range === 'Today' || range === 'This Week' || range === 'This Month' || range === 'This Year') {
        return true;
      } else {
        return false;
      }
    }

    // Support DD-MM-YYYY and DD/MM/YYYY
    const dmyMatch = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (dmyMatch) {
      const day = parseInt(dmyMatch[1], 10);
      const month = parseInt(dmyMatch[2], 10) - 1;
      const year = parseInt(dmyMatch[3], 10);
      d = new Date(year, month, day);
    } else {
      const cleanDateStr = trimmed.replace(/Sept/gi, 'Sep').replace(/July/gi, 'Jul').replace(/June/gi, 'Jun');
      d = new Date(cleanDateStr);
    }
  } else if (typeof dateInput === 'number') {
    d = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    d = dateInput;
  }

  if (!d || isNaN(d.getTime())) return false;

  const now = new Date();
  const dateTime = d.getTime();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  switch (range) {
    case 'Today':
      return dateTime >= todayStart && dateTime <= todayEnd;

    case 'This Week': {
      const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
      const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon, 0, 0, 0, 0).getTime();
      const weekEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon + 6, 23, 59, 59, 999).getTime();
      return dateTime >= weekStart && dateTime <= weekEnd;
    }

    case 'This Month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0).getTime();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      return dateTime >= monthStart && dateTime <= monthEnd;
    }

    case 'Previous Month':
    case 'Last Month': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0).getTime();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      return dateTime >= lastMonthStart && dateTime <= lastMonthEnd;
    }

    case 'This Year': {
      const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0).getTime();
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999).getTime();
      return dateTime >= yearStart && dateTime <= yearEnd;
    }

    case 'Last Year': {
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0, 0).getTime();
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime();
      return dateTime >= lastYearStart && dateTime <= lastYearEnd;
    }

    default:
      return true;
  }
};
