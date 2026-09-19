// Helper utility to filter items by date range (Today, This Week, This Month, Last Month, This Year, All Time)

export const isDateInRange = (dateInput, range) => {
  if (!range || range === 'All Time') return true;
  if (!dateInput) return true;

  let d = null;
  if (typeof dateInput === 'string') {
    if (dateInput.toLowerCase().includes('today')) {
      if (range === 'Today' || range === 'This Week' || range === 'This Month' || range === 'This Year') {
        return true;
      } else {
        return false;
      }
    }
    d = new Date(dateInput);
  } else if (typeof dateInput === 'number') {
    d = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    d = dateInput;
  }

  if (!d || isNaN(d.getTime())) return true;

  const now = new Date();
  const dateTime = d.getTime();

  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999).getTime();

  switch (range) {
    case 'Today':
      return dateTime >= todayStart && dateTime <= todayEnd;

    case 'This Week': {
      const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon
      const diffToMon = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon).getTime();
      return dateTime >= weekStart;
    }

    case 'This Month': {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return dateTime >= monthStart;
    }

    case 'Last Month': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999).getTime();
      return dateTime >= lastMonthStart && dateTime <= lastMonthEnd;
    }

    case 'This Year': {
      const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
      return dateTime >= yearStart;
    }

    case 'Last Year': {
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1).getTime();
      const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999).getTime();
      return dateTime >= lastYearStart && dateTime <= lastYearEnd;
    }

    default:
      return true;
  }
};
