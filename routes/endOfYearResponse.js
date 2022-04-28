const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSetting = require('../services/goalSettingService');
const selfAssessment = require('../services/selfAssessmentService');
const employees = require('../services/employeeService');
const logs = require('../services/logService')
const endYearAssessment = require('../services/endOfYearAssessmentService')
const endYearResponse = require('../services/endOfYearResponseService')
const goalSettingYear = require("../services/goalSettingYearService");

/* Add end of year question Assessment */
router.get('/', auth, async function (req, res, next) {
    try {

        const questions = await endYearAssessment.getEndOfYearAssessmentQuestions().then((data) => {
            return data
        })

        return res.status(200).json(questions)

    } catch (err) {
        console.error(`Error while fetching questions `, err.message);
        next(err);
    }
});

/* Get Mid Year Checking Assessment, use for prefilling during end of year  */
router.get('/prefill-end-year/:emp_id', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })
        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(`Goal Setting or Employee Does Not exist`)
        }

        const goalSettingYearData = await goalSettingYear.getGoalSettingYear().then((data) => {
            return data
        })

        if (_.isEmpty(goalSettingYearData) || _.isNull(goalSettingYearData)) {
            return res.status(400).json(`No goal Setting Year Set Up`)
        }

        const year = goalSettingYearData.gsy_year

        const filledGoalSettings = await goalSetting.findGoalSetting(2, year).then((data) => {
            return data
        })
        if (_.isEmpty(filledGoalSettings) || _.isNull(filledGoalSettings)) {
            return res.status(400).json(`No Goal Setting Activity for the year`)
        }
        const goalId = filledGoalSettings.gs_id

        const unFilledGoalSettings = await goalSetting.findGoalSetting(3, year).then((data) => {
            return data
        })
        if (_.isEmpty(unFilledGoalSettings) || _.isNull(unFilledGoalSettings)) {
            return res.status(400).json(`No End of year Activity for the year`)
        }
        const unFilledGoalId = unFilledGoalSettings.gs_id

        const empQuestions = await selfAssessment.findSelfAssessmentsEmployeeYear(empId, goalId).then((data) => {
            return data
        })
        if (_.isEmpty(empQuestions) || _.isNull(empQuestions)) {
            return res.status(400).json(`Employee has no record of goal settings for active year`)
        }

        const endYearQuestions = await endYearAssessment.getEndOfYearAssessmentQuestionByGoal(unFilledGoalId).then((data) => {
            return data
        })
        if (_.isEmpty(endYearQuestions) || _.isNull(endYearQuestions)) {
            return res.status(400).json(`No End of Year Questions`)
        }

        const resObject = {
          "midYearCheckingQuestions": empQuestions,
          "endOfYearQuestions": endYearQuestions
        }

        return res.status(200).json(resObject)
    } catch (err) {
        return res.status(400).json(`Error while fetching`);

    }
});


/* Add end of year question Assessment */
router.post('/add-question', auth, async function (req, res, next) {
    try {
        const eyaRequests = req.body
        let addResponse;
        let destroyResponse;
        let gsData;
        let i = 0;
        let gsId;
        for (const eya of eyaRequests) {

            gsData = await goalSetting.getActiveGoalSetting(eya.eya_gs_id).then((data) => {
                return data
            })

            if (_.isEmpty(gsData) || _.isNull(gsData) || parseInt(gsData.gs_activity) !== 3 || parseInt(gsData.gs_status) !== 1) {
                i++
                destroyResponse = await endYearAssessment.removeAssessment(eya.eya_gs_id).then((data) => {
                    return data
                })
                break

            } else {
                eya.eya_year = gsData.gs_year
                addResponse = await endYearAssessment.addEndOfYearAssessment(eya).then((data) => {
                    return data
                })

            }

        }

        if (i > 0) {

            return res.status(400).json(`An error Occurred, Check for Open End of Activity`)
        } else {
            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Added Ended of Year Question",
                "log_date": new Date()
            }
            await logs.addLog(logData).then((logRes) => {

                return res.status(200).json(`Action Successful`)
            })

        }


    } catch (err) {
        console.error(`Error while Adding Questions `, err.message);
        next(err);
    }
});


router.patch('/update-question/:eya_id', auth, async function (req, res, next) {
    try {

        let eyaId = req.params.eya_id


        const eyaQuestion = await endYearAssessment.getEndOfYearAssessmentQuestion(eyaId).then((data) => {
            return data
        })


        if (_.isNull(eyaQuestion) || _.isEmpty(eyaQuestion)) {
            return res.status(404).json(`Question Not Found`)
        } else {
            const schema = Joi.object({
                eya_question: Joi.string().required(),
            })

            const eyaRequests = req.body
            const validationResult = schema.validate(eyaRequests)
            if (validationResult.error) {
                return res.status(400).json(validationResult.error.details[0].message)
            }

            const updateEya = await endYearAssessment.updateQuestion(eyaId, eyaRequests.eya_question).then((data) => {
                return data
            })

            // const updateSelfAssessmentQuestion = await selfAssessment.updateQuestion(eyaId, eyaRequests.eya_question).then((data)=>{
            //     return data
            // })

            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Updated End of Year Question",
                "log_date": new Date()
            }
            await logs.addLog(logData).then((logRes) => {

                return res.status(200).json(`Action Successful`)
            })


        }

    } catch (err) {
        console.error(`Error while Adding Questions `, err.message);
        next(err);
    }
});


module.exports = router;
