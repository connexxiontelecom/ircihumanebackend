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



/* Add end of year question Assessment */
router.post('/add-question', auth, async function (req, res, next) {
    try {

        const schema = Joi.object().keys({
            eya_gs_id: Joi.number().required(),
            eya_question: Joi.string().required(),

        })
        const schemas = Joi.array().items(schema)
        const eyaRequests = req.body
        let validationResult = schemas.validate(eyaRequests)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

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
