const differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
// const isSaturday = require('date-fns/isSaturday')
// const isSunday = require('date-fns/isSunday')
const isWeekend = require('date-fns/isWeekend')
const isBefore = require('date-fns/isBefore')


async function businessDaysDifference(endDate, beginningDate) {
    endDate = new Date(endDate)
    beginningDate = new Date(beginningDate)
    let daysBeforeStart = await differenceInBusinessDays(endDate, beginningDate)
    if(!await isWeekend(endDate) && !await isWeekend(beginningDate)){
        daysBeforeStart++
    }

    if(!await isWeekend(endDate) && await isWeekend(beginningDate)){
        daysBeforeStart++
    }
    return daysBeforeStart
}


module.exports = {
    businessDaysDifference,
}
