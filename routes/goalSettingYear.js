const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSettingYear = require('../services/goalSettingYearService');
const logs = require('../services/logService')


/* Get All goals setting */
router.get('/', auth, async function (req, res, next) {
    try {
        await goalSettingYear.getGoalSettingYear().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching goal setting year ${err.message}`)
    }
});

router.post('/add-year', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            gsy_year: Joi.string().required(),

        })

        const gsyRequest = req.body
        const validationResult = schema.validate(gsyRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const existingRecords = await goalSettingYear.getGoalSettingYear().then((data) => {
            return data
        })
        if (!(_.isEmpty(existingRecords) || _.isNull(existingRecords))) {
            const removeResponse = await goalSettingYear.removeGoalSettingYear().then((data) => {
                return data
            })
            if (!removeResponse) {
                return res.status(400).json(`Existing record was not removed`)
            }

        }
        const addResponse = await goalSettingYear.addGoalSettingYear(gsyRequest).then((data) => {
            return data
        })

        if (!(_.isEmpty(addResponse) || _.isNull(addResponse))) {
            return res.status(200).json(`Operation Successful`)
        }
    } catch (err) {
        return res.status(400).json(`Error while fetching goal settings ${err.message}`)
    }
});

router.get('/get-open-end-Year', auth, async function (req, res, next) {
    try {
        await goalSetting.findEndYearGoals().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching goal settings ${err.message}`)
    }
});

/* Add goal */
router.post('/add-goal-setting', auth, async function (req, res, next) {
    try {
        //check if year from date equals year entered,
        // check if from date is not greater than to date

        const schema = Joi.object({
            gs_from: Joi.string().required(),
            gs_to: Joi.string().required(),
            gs_year: Joi.string().required(),
            gs_activity: Joi.string().required(),

        })

        const gsRequest = req.body
        const validationResult = schema.validate(gsRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const from = new Date(gsRequest.gs_from)
        const fromYear = from.getFullYear()
        const to = new Date(gsRequest.gs_to)
        const toYear = to.getFullYear()
        const year = gsRequest.gs_year

        if (String(fromYear) === String(toYear)) {

            const goalSettingActivityYear = await goalSetting.findGoalSetting(gsRequest.gs_activity, gsRequest.gs_year).then((data) => {
                return data
            })

            if (_.isEmpty(goalSettingActivityYear) || _.isNull(goalSettingActivityYear)) {

                const activeGoalsYear = await goalSetting.findActiveGoal(gsRequest.gs_year).then((data) => {
                    return data
                })

                if (!_.isEmpty(activeGoalsYear) || !_.isNull(activeGoalsYear)) {
                    const closeAllGoals = await goalSetting.closeAllGoals().then((data) => {
                        return data
                    })
                }

                gsRequest.gs_status = 1
                await goalSetting.addGoalSetting(gsRequest).then((data) => {
                    if (_.isEmpty(data) || _.isNull(data)) {
                        return res.status(400).json("An Error Occurred while adding goals")
                    } else {

                        const goalSettingLogObject = {
                            gsl_activity: gsRequest.gs_activity,
                            gsl_year: gsRequest.gs_year,
                            gsl_status: gsRequest.gs_status
                        }

                        goalSettingLog.addGoalSettingLog(goalSettingLogObject).then((data) => {

                            const logData = {
                                "log_user_id": req.user.username.user_id,
                                "log_description": "Added Goal Setting",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes) => {
                                return res.status(200).json('Action Successful')
                            })
                        })
                    }
                })


            } else {
                return res.status(400).json("Goal Setting for specific year and activity already announced")

            }
        } else {
            return res.status(400).json("From and to date dont match year")
        }


    } catch (err) {
        console.error(`Error while assigning supervisor `, err.message);
        next(err);
    }
});

/* Close Goal  */

router.patch('/close-goal-setting/:gs_id', auth, async function (req, res, next) {
    try {
        const gsId = req.params.gs_id
        const schema = Joi.object({
            gs_from: Joi.string().required(),
            gs_to: Joi.string().required(),
            gs_year: Joi.string().required(),
            gs_activity: Joi.string().required(),
            gs_status: Joi.number().required()
        })

        const gsRequest = req.body
        const validationResult = schema.validate(gsRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await goalSetting.closeGoalSetting(gsId).then((data) => {
            if (_.isEmpty(data) || _.isNull(data)) {
                return res.status(400).json("An Error Occurred")
            } else {

                const goalSettingLogObject = {
                    gsl_activity: gsRequest.gs_activity,
                    gsl_year: gsRequest.gs_year,
                    gsl_status: gsRequest.gs_status
                }

                goalSettingLog.addGoalSettingLog(goalSettingLogObject).then((data) => {

                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Closed Goal Setting",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {
                        return res.status(200).json('Action Successful')
                    })
                })
            }
        })


    } catch (err) {
        console.error(`Error while assigning supervisor `, err.message);
        next(err);
    }
});

module.exports = router;
