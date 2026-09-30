const { isWeekend } = require('date-fns');

function formatDateKey(dateValue) {
  const date = new Date(dateValue);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calculateLeaveDays(startDate, endDate, holidayDates = []) {
  const holidayKeys = new Set((holidayDates || []).map((holidayDate) => formatDateKey(holidayDate)));
  const current = new Date(startDate);
  const final = new Date(endDate);
  let leaveDays = 0;

  while (current <= final) {
    const dateKey = formatDateKey(current);
    if (!isWeekend(current) && !holidayKeys.has(dateKey)) {
      leaveDays += 1;
    }
    current.setDate(current.getDate() + 1);
  }

  return leaveDays;
}

module.exports = {
  calculateLeaveDays,
  formatDateKey,
};
