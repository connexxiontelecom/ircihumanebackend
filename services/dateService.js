const isWeekend = require('date-fns/isWeekend');
const eachDayOfInterval = require('date-fns/eachDayOfInterval');

function businessDaysDifference(endDate, startDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const businessDays = eachDayOfInterval({ start, end });
  return businessDays.filter((date) => !isWeekend(date)).length;
}

// async function businessDaysDifference(endDate, beginningDate) {
//   endDate = new Date(endDate);
//   beginningDate = new Date(beginningDate);
//   let daysBeforeStart = await differenceInBusinessDays(endDate, beginningDate);
//   if (!(await isWeekend(endDate)) || !(await isWeekend(beginningDate))) {
//     daysBeforeStart++;
//   }
//   //
//   if (!(await isWeekend(endDate)) && (await isWeekend(beginningDate))) {
//     daysBeforeStart++;
//   }
//   return daysBeforeStart;
// }

module.exports = {
  businessDaysDifference
};
