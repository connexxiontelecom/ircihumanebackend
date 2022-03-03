const { describe, it, xit, test } = require("@jest/globals")
// const dotenv = require('dotenv');
//
// dotenv.config();
// let token = process.env.LOGIN_TOKEN
const request = require('supertest')
const app = require('../app');
const { addLeaveAccrual, computeLeaveAccruals } = require("../routes/leaveAccrual")
describe('IrcIhumane Api LeaveAccrual', () => {
    xtest('add into leave accrual', ()=> {
        const tempData = {
            lea_emp_id: 1,
            lea_month: 1,
            lea_year: 2021,
            lea_leave_type: 1,
            lea_rate: 1.5
        }

        return addLeaveAccrual(tempData).then(data => expect(data).toMatchObject({
            lea_emp_id: 1,
            lea_month: 1,
            lea_year: 2021,
            lea_leave_type: 1,
            lea_rate: 1.5,

        }));


          })
   test('compute leave accruals', ()=> {
        const tempData = {
            lea_emp_id: 2,
            lea_year: 2021,
            lea_leave_type: 1,

        }

        return computeLeaveAccruals(tempData).then(data => expect(data).toBe(null));


    })


})
