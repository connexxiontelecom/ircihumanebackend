const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const salaryGrade = require('../services/salaryGradeService')
const logs = require('../services/logService')

/* Get all Salary Grades */
router.get('/', auth, async function (req, res, next) {
    try {

        salaryGrade.findSalaryGrades().then((data) => {
            return res.status(200).json(data)
        })

    } catch (err) {

        return res.status(400).json(err.message)
        next(err);
    }
});


/* Add to Salary Grade */
router.post('/add-salary-grade', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            sg_name: Joi.string().required(),
            sg_minimum: Joi.number().precision(2).required(),
            sg_midpoint: Joi.number().precision(2).required(),
            sg_maximum: Joi.number().precision(2).required(),
        })

        const salaryGradeRequest = req.body
        const validationResult = schema.validate(salaryGradeRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        if ((salaryGradeRequest.sg_minimum < salaryGradeRequest.sg_midpoint) && (salaryGradeRequest.sg_midpoint < salaryGradeRequest.sg_maximum)) {
            salaryGrade.findSalaryGradeByName(salaryGradeRequest.sg_name).then((salaryGradeData) => {
                if (_.isEmpty(salaryGradeData) || _.isNull(salaryGradeData)) {
                    salaryGrade.addSalaryGrade(salaryGradeRequest).then((data) => {
                        const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Added New Salary Grade",
                            "log_date": new Date()
                        }
                        logs.addLog(logData).then((logRes) => {
                            return res.status(200).json('Action Successful')
                        })
                    })
                } else {

                    return res.status(400).json('Salary Grade Already Exists')
                }
            })

        } else {
            return res.status(400).json(`Confirm minimum, midpoint and maximum`)
        }

    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});


/* Update Salary Grade */
router.patch('/update-salary-grade/:sg_id', auth, async function (req, res, next) {
    try {
        const sgId = req.params.sg_id
        const schema = Joi.object({
            sg_name: Joi.string().required(),
            sg_minimum: Joi.number().precision(2).required(),
            sg_midpoint: Joi.number().precision(2).required(),
            sg_maximum: Joi.number().precision(2).required(),
        })

        const salaryGradeRequest = req.body
        const validationResult = schema.validate(salaryGradeRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        salaryGrade.findSalaryGradeByName(salaryGradeRequest.sg_name).then((salaryGradeData) => {
            if (_.isEmpty(salaryGradeData) || _.isNull(salaryGradeData)) {
                salaryGrade.updateSalaryGrade(sgId, salaryGradeRequest).then((data) => {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Updated Salary Grade",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {
                        return res.status(200).json('Action Successful')
                    })
                })
            } else {
                if (parseInt(salaryGradeData.sg_id) === parseInt(sgId)) {
                    salaryGrade.updateSalaryGrade(sgId, salaryGradeRequest).then((data) => {
                        const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Updated Salary Grade",
                            "log_date": new Date()
                        }
                        logs.addLog(logData).then((logRes) => {
                            return res.status(200).json('Action Successful')
                        })
                    })
                } else {
                    return res.status(400).json('Salary Grade Already Exists')
                }
            }
        })
    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});


/* Get Salary Grade */

router.get('/:sg_id', auth, async function (req, res, next) {
    try {
        const sgId = req.params.sg_id
        salaryGrade.findSalaryGrade(sgId).then((data) => {
            if (_.isEmpty(data) || _.isNull(data)) {
                return res.status(404).json('Grade Not Found')
            } else {
                return res.status(200).json(data)
            }
        })

    } catch (err) {

        return res.status(400).json(err.message)
        next(err);
    }
});


module.exports = router;
