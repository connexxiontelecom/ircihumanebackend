const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSetting = require('../services/goalSettingService');
const selfAssessment = require('../services/selfAssessmentService');
const employees = require('../services/employeeService');
const endYearRating = require('../services/endYearRatingService');
const logs = require('../services/logService')
const goalSettingYear = require('../services/goalSettingYearService');
const endYearAssessment = require('../services/endOfYearAssessmentService')

/* Add Self Assessment */
router.post('/add-self-assessment/:emp_id/:gs_id', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        let gsId = req.params.gs_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)

        } else {

            if (parseInt(gsData.gs_status) === 1) {
                const schema = Joi.object().keys({
                    sa_comment: Joi.string().required(),
                })
                const schemas = Joi.array().items(schema)
                const saRequests = req.body

                let validationResult = schemas.validate(saRequests)
                if (validationResult.error) {
                    return res.status(400).json(validationResult.error.details[0].message)
                }
                let addResponse;
                let destroyResponse;
                let i = 0;

                await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                    return data
                })

                for (const sa of saRequests) {
                    sa.sa_emp_id = empId
                    sa.sa_gs_id = gsId
                    addResponse = await selfAssessment.addSelfAssessment(sa).then((data) => {
                        return data
                    })

                    if (_.isEmpty(addResponse) || _.isNull(addResponse)) {
                        destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                            return data
                        })

                        i++;
                        break
                    }

                }

                if (i > 0) {
                    return res.status(400).json(`An error Occurred while adding`)
                } else {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Responded to Goal Setting",
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes) => {

                        return res.status(200).json(`Action Successful`)
                    })

                }
            } else {
                return res.status(400).json(`Goal Setting Not Opened`)
            }


        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


/* Approve Self Assessment */

router.post('/approve-assessment/', auth, async function (req, res, next) {
    try {
        const schema = Joi.object().keys({
            sa_id: Joi.number().required(),
        })
        const schemas = Joi.array().items(schema)
        const saRequests = req.body

        let validationResult = schemas.validate(saRequests)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const updateResponse = await selfAssessment.selfAssessmentStatusUpdate(saRequests, 1).then((data) => {
            return data
        })

        if (_.isEmpty(updateResponse) || _.isNull(updateResponse)) {
            return res.status(400).json('An Error Occurred while updating status')
        }

        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Approved Goal Setting for Employee",
            "log_date": new Date()
        }
        await logs.addLog(logData).then((logRes) => {

            return res.status(200).json(`Action Successful`)
        })

    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


/* Pre Fill Self Assessment  */
router.get('/prefill-self-assessment/:emp_id', auth, async function (req, res, next) {
    try {

        let empId = req.params.emp_id

        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(`Employee does not exist`)
        }

        const goalSettingYearData = await goalSettingYear.getGoalSettingYear().then((data) => {
            return data
        })

        if (_.isEmpty(goalSettingYearData) || _.isNull(goalSettingYearData)) {
            return res.status(400).json(`No goal Setting Year Set Up`)
        }

        const year = goalSettingYearData.gsy_year

        const gsData = await goalSetting.getEndOfYearActivityYear(year).then((data) => {
            return data
        })

        if(_.isEmpty(gsData) || _.isNull(gsData)){
            return res.status(400).json(`No End of year activity set`)
        }
        const gsId = gsData.gs_id

        const previousEntries = await selfAssessment.findSelfAssessment(gsId, empId).then((data)=>{
            return data
        })

        if(_.isEmpty(previousEntries) || _.isNull(previousEntries)){

            const endYearQuestions = await endYearAssessment.getEndOfYearAssessmentQuestionByGoal(gsId).then((data) => {
                return data
            })

            if(_.isEmpty(endYearQuestions) || _.isNull(endYearQuestions)){
                return res.status(400).json(`No End of year questions Set`)
            }

            for (const eya of endYearQuestions) {
                const eyaObject = {
                    sa_gs_id: gsId,
                    sa_emp_id: empId,
                    sa_comment: eya.eya_question,
                    sa_eya_id: eya.eya_id
                }

                //insert into self assessment
                const addResponse = await selfAssessment.addSelfAssessmentEndYear(eyaObject).then((data) => {
                    return data
                })

                if (_.isNull(addResponse) || _.isEmpty(addResponse)) {
                    const destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                        return data
                    })
                    return res.status(400).json(`No End of year activity set`)
                }
            }

            return res.status(200).json(`End of Year Questions loaded successfully`)
        }else{
            return res.status(400).json(`End of Year Questions already Filled`)
        }

    } catch (err) {
        console.error(`Error while prefilling goals `, err.message);
        next(err);
    }
});

router.patch('/respond-self-assessment/:emp_id/', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id


        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })


        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(` Employee Does Not exist`)

        } else {

            const schema = Joi.object().keys({
                sa_id: Joi.number().required(),
                sa_response: Joi.string().required(),
                sa_status: Joi.number().required()

            })
            const schemas = Joi.array().items(schema)
            const selfAssessmentRequests = req.body

            let validationResult = schemas.validate(selfAssessmentRequests)
            if (validationResult.error) {
                return res.status(400).json(validationResult.error.details[0].message)
            }

            for (const sa of selfAssessmentRequests) {
                await selfAssessment.respondSelfAssessment(sa.sa_id, sa.sa_response).then((data) => {
                    return data
                })
            }
            return res.status(200).json(`Action Successful`)
        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});

/* Get Self Assessment  */
router.get('/get-self-assessment/:emp_id/:gs_id', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        let gsId = req.params.gs_id

        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })


        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })


        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Goal Setting or Employee Does Not exist`)

        } else {
            let empQuestions = await selfAssessment.findSelfAssessment(gsId, empId).then((data) => {
                return data

            })

            return res.status(200).json(empQuestions)

        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});

router.get('/get-self-assessments/:emp_id', auth, async function (req, res, next) {
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

        const yearGoalSettings = await goalSetting.getGoalSettingYear(year).then((data) => {
            return data
        })

        if (_.isEmpty(yearGoalSettings) || _.isNull(yearGoalSettings)) {
            return res.status(400).json(`No goal Setting for the year`)
        }
        let goalSettingIds = []
        for (const ygs of yearGoalSettings) {
            goalSettingIds.push(ygs.gs_id)
        }

        let empQuestions = await selfAssessment.findSelfAssessmentsEmployeeYear(empId, goalSettingIds).then((data) => {
            return data

        })
        return res.status(200).json(empQuestions)
    } catch (err) {
        console.error(`Error while fetching Goals `, err.message);
        next(err);
    }
});


/* Update Self Assessment */

router.patch('/update-self-assessment/:emp_id/', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id


        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })


        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(` Employee Does Not exist`)

        } else {

            const schema = Joi.object().keys({
                sa_id: Joi.number().required(),
                sa_comment: Joi.string().required(),

            })
            const schemas = Joi.array().items(schema)
            const selfAssessmentRequests = req.body

            let validationResult = schemas.validate(selfAssessmentRequests)
            if (validationResult.error) {
                return res.status(400).json(validationResult.error.details[0].message)
            }


            for (const sa of selfAssessmentRequests) {
                await selfAssessment.updateSelfAssessment(sa.sa_id, sa.sa_comment).then((data) => {
                    return data
                })
            }
            return res.status(200).json(`Action Successful`)
        }


    } catch (err) {
        console.error(`Error while Updating Goals `, err.message);
        next(err);
    }
});


/*Update Assessment */
router.patch('/update-assessment/:emp_id/:gs_id', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        let gsId = req.params.gs_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)

        } else {

            const year  = gsData.gs_year

            const goalsYear = await goalSetting.getGoalSettingYear(year).then((data)=>{
                return data
            })

            if(_.isEmpty(goalsYear) || _.isNull(year)){
                return res.status(400).json(`No Goals for the year`)
            }



            const gsIds = []

            for(const goalYear of goalsYear){
                gsIds.push(goalYear.gs_id)
            }
            //return res.status(200).json(gsIds)

                const schema = Joi.object().keys({
                    sa_comment: Joi.string().required(),
                })
                const schemas = Joi.array().items(schema)
                const saRequests = req.body

                let validationResult = schemas.validate(saRequests)
                if (validationResult.error) {
                    return res.status(400).json(validationResult.error.details[0].message)
                }
                let addResponse;
                let destroyResponse;
                let i = 0;

                await selfAssessment.removeSelfAssessment(gsIds, empId).then((data) => {
                    return data
                })

                for (const sa of saRequests) {
                    sa.sa_emp_id = empId
                    sa.sa_gs_id = gsId
                    addResponse = await selfAssessment.addSelfAssessment(sa).then((data) => {
                        return data
                    })

                    if (_.isEmpty(addResponse) || _.isNull(addResponse)) {
                        destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                            return data
                        })

                        i++;
                        break
                    }

                }

                if (i > 0) {
                    return res.status(400).json(`An error Occurred while adding`)
                } else {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Responded to Goal Setting",
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes) => {

                        return res.status(200).json(`Action Successful`)
                    })

                }



        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});

router.patch('/supervisor-update-self-assessment/:emp_id/', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id


        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })


        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(` Employee Does Not exist`)

        } else {

            const schema = Joi.object().keys({
                sa_id: Joi.number().required(),
                sa_comment: Joi.string().required(),
                sa_status: Joi.number().required()

            })
            const schemas = Joi.array().items(schema)
            const selfAssessmentRequests = req.body

            let validationResult = schemas.validate(selfAssessmentRequests)
            if (validationResult.error) {
                return res.status(400).json(validationResult.error.details[0].message)
            }


            for (const sa of selfAssessmentRequests) {
                await selfAssessment.supervisorUpdateSelfAssessment(sa.sa_id, sa.sa_comment, sa.sa_status).then((data) => {
                    return data
                })
            }
            return res.status(200).json(`Action Successful`)
        }


    } catch (err) {
        console.error(`Error while Updating Goals `, err.message);
        next(err);
    }
});

router.get('/get-end-questions/:emp_id/:gs_id', auth, async function (req, res, next) {
    try {

        let empId = req.params.emp_id
        let gsId = req.params.gs_id

        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })


        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })


        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Goal Setting or Employee Does Not exist`)

        } else {
            if (parseInt(gsData.gs_status) === 1) {
                let currentYear = gsData.gs_year;
                let gss = await goalSetting.getGoalSettingYear(currentYear).then((data) => {
                    return data
                })

                if (_.isEmpty(gss) || _.isNull(gss)) {
                    return res.status(404).json(`No Goal Setting found`)
                } else {
                    let ratingStatus = 0
                    let ratingDetails;
                    let gsIdArray = []

                    for (const gs of gss) {
                        gsIdArray.push(gs.gs_id)
                    }

                    let questionData = await selfAssessment.findSelfAssessmentQuestions(empId, gsIdArray).then((data) => {
                        return data
                    })

                    let employeeRating = await endYearRating.findEmployeeRating(empId, currentYear).then((data) => {
                        return data
                    })

                    if (!(_.isEmpty(employeeRating) || _.isNull(employeeRating))) {
                        ratingStatus = 1
                        ratingDetails = employeeRating

                    }

                    const resData = {
                        question: questionData,
                        year: currentYear,
                        ratingStatus: ratingStatus,
                        ratingDetails: ratingDetails
                    }
                    return res.status(200).json(resData)


                }


            } else {
                return res.status(400).json(`Goal Setting Not Opened`)
            }

        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});

module.exports = router;
