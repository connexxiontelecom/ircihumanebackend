const { describe, it, xit, test } = require("@jest/globals")
const { businessDaysDifference } = require("../services/dateService")
describe('IrcIhumane DateService', () => {
    test('Compute Business Days Difference beginning week date end weekend', async () => {
        const endDate = '2022-05-22'
        const beginningDate = '2022-05-09'
        expect(await businessDaysDifference(endDate, beginningDate)).toBe(10);
    })

    test('Compute Business Days Difference beginning weekday end weekday', async () => {
        const endDate = '2022-05-30'
        const beginningDate = '2022-05-09'
        expect(await businessDaysDifference(endDate, beginningDate)).toBe(16);
    })

    test('Compute Business Days Difference beginning weekend end weekday', async () => {
        const endDate = '2022-05-13'
        const beginningDate = '2022-05-08'
        expect(await businessDaysDifference(endDate, beginningDate)).toBe(5);
    })

    test('Compute Business Days Difference beginning weekend end weekday', async () => {
        const endDate = '2022-05-22'
        const beginningDate = '2022-05-08'
        expect(await businessDaysDifference(endDate, beginningDate)).toBe(10);
    })

})
