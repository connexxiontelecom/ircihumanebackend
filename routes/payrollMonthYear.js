const Joi = require('joi')
const express = require('express');
const _ = require('lodash')
const router = express.Router();
const auth = require("../middleware/auth");
const payrollMonthYear = require('../services/payrollMonthYearService');
const logs = require('../services/logService')


/* Get All Payment Definitions */
router.get('/', auth, async function (req, res, next) {
    try {

        // return res.status(200).json(req.user.username);

        await payrollMonthYear.findPayrollMonthYear().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching payroll month and year ${err.message}`)
    }
});

/* Add Payment Definition */
router.post('/add-payroll-month-year', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            pym_month: Joi.string().required(),
            pym_year: Joi.string().required(),
        })

        const payrollMonthYearRequest = req.body
        const validationResult = schema.validate(payrollMonthYearRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await payrollMonthYear.findPayrollMonthYear().then((data) => {
            if (_.isEmpty(data)) {

                payrollMonthYear.addPayrollMonthYear(payrollMonthYearRequest).then((data) => {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Added new payroll Month and year",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {

                        return res.status(200).json(data)
                    })
                })

            } else {
                let pymId = data.pym_id;
                payrollMonthYear.updatePayrollMonthYear(payrollMonthYearRequest, pymId).then((data) => {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Updated payroll Month and year",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {

                        return res.status(200).json(data)
                    })
                })

            }
        })
    } catch (err) {
        console.error(`Error while adding payroll Month and Year `, err.message);
        next(err);
    }
});


module.exports = router;
