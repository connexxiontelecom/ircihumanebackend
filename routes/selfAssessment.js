const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSetting = require('../services/goalSettingService');
const selfAssessment = require('../services/selfAssessmentService');
const selfAssessmentMaster = require('../services/selfAssessmentMasterService');
const employees = require('../services/employeeService');
const endYearRating = require('../services/endYearRatingService');
const logs = require('../services/logService')
const goalSettingYear = require('../services/goalSettingYearService');
const endYearAssessment = require('../services/endOfYearAssessmentService')
const {sequelize, Sequelize} = require('../services/db');
const supervisorModel = require('../models/supervisorassignment')(sequelize, Sequelize.DataTypes);
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
const selfAssessmentMasterModel = require('../models/selfassessmentmaster')(sequelize, Sequelize.DataTypes);
const selfAssessmentModel = require('../models/selfassessment')(sequelize, Sequelize.DataTypes);

/* Add Self Assessment */
router.post('/add-self-assessment/:emp_id/:gs_id', auth(), async function (req, res, next) {
    let saData;
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


            if (employeeData.emp_supervisor_id === null || employeeData.emp_supervisor_id === '') {
                return res.status(400).json("There's currently no supervisor assigned to you to process this request.");
            }


            if (parseInt(gsData.gs_status) === 1) {

                const checkAssessmentMaster = await selfAssessmentMaster.findAssessmentMaster(gsId, empId).then((data) => {
                    return data
                })

                if (!(_.isEmpty(checkAssessmentMaster) || _.isNull(checkAssessmentMaster))) {
                    const removeAssessmentMaster = await selfAssessmentMaster.removeSelfAssessmentMaster(gsId, empId).then((data) => {
                        return data
                    })
                }


                const selfAssessmentMasterData = {
                    sam_gs_id: gsId,
                    sam_emp_id: empId,
                    sam_supervisor_id: employeeData.emp_supervisor_id,
                    sam_status: 0,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    sam_year: gsData.gs_year
                }

                const addMaster = await selfAssessmentMaster.addSelfAssessmentMaster(selfAssessmentMasterData).then((data) => {
                    return data
                })

                if (_.isEmpty(addMaster) || _.isNull(addMaster)) {
                    return res.status(400).json(`An error occurred while adding master details`)
                }


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
                const masterId = addMaster.sam_id

                await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                    return data
                })


                for (const sa of saRequests) {
                    saData = {
                        sa_gs_id: gsId,
                        sa_emp_id: empId,
                        sa_comment: sa.sa_comment,
                        sa_master_id: masterId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        /*sa.sa_emp_id = empId
                        sa.sa_gs_id = gsId
                        sa.sa_master_id = masterId*/
                    }

                    addResponse = await selfAssessment.addSelfAssessment(saData).then((data) => {
                        return data
                    })

                    if (_.isEmpty(addResponse) || _.isNull(addResponse)) {
                        destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                            return data
                        })

                        destroyResponse = await selfAssessmentMaster.removeSelfAssessmentMaster(gsId, empId).then((data) => {
                            return data
                        })

                        i++;
                        break
                    }

                }
                //send notification //subject, body="You have a new notification", user_id, post_id, url
                const subject = "Self-assessment (Beginning of year)";
                const body = "A new self-assessment request was submitted";
                //emp
                const notify = await notificationModel.registerNotification(subject, body, empId, 11, 'url-here');
                const url = req.headers.referer;
                const notifySupervisor = await notificationModel.registerNotification(subject, body, employeeData.emp_supervisor_id, 0, url);

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

/* Get Self Assessment, use for prefilling */
router.get('/get-self-assessments/:emp_id', auth(), async function (req, res, next) {
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
        const openGs = await goalSetting.findOpenGoals().then((r) => {
            return r;
        });

        let empQuestions = await selfAssessment.findSelfAssessmentsEmployeeYear(empId, goalSettingIds).then((data) => {
            return data

        })
        const goals = {
            questions: empQuestions,
            openGoal: openGs
        }

        return res.status(200).json(goals)
    } catch (err) {
        return res.status(400).json(`Error while fetching Goals `);
        next(err);
    }
});


/* Get Self Assessment, use for prefilling during midyear checking */
router.get('/prefill-goal-setting/:emp_id', auth(), async function (req, res, next) {
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

        const filledGoalSettings = await goalSetting.findGoalSetting(1, year).then((data) => {
            return data
        })
        if (_.isEmpty(filledGoalSettings) || _.isNull(filledGoalSettings)) {
            return res.status(400).json(`No Goal Setting Activity for the year`)
        }
        const goalId = filledGoalSettings.gs_id

        const empQuestions = await selfAssessment.findSelfAssessmentsEmployeeYear(empId, goalId).then((data) => {
            return data
        })
        if (_.isEmpty(empQuestions) || _.isNull(empQuestions)) {
            return res.status(400).json(`Employee has no record of goal settings for active year`)
        }
        return res.status(200).json(empQuestions)
    } catch (err) {
        return res.status(400).json(`Error while fetching Goals `);

    }
});


/* Add Self Assessment */
router.post('/add-self-assessment-mid-year/:emp_id/:gs_id', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object().keys({
            sa_comment: Joi.string().required(),
            sam_discussion_held_on: Joi.string().required(),
            sa_update: Joi.string().required(),
            sa_accomplishment: Joi.string().allow(null, ''),
            sa_challenges: Joi.string().allow(null, ''),
            sa_support_needed: Joi.string().allow(null, ''),
            sa_next_steps: Joi.string().allow(null, ''),
            optional: Joi.string().allow(null, ''),
        })
        const schemas = Joi.array().items(schema)
        const saRequests = req.body

        let validationResult = schemas.validate(saRequests)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let empId = req.params.emp_id
        let gsId = req.params.gs_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`);
        }

        if (parseInt(gsData.gs_status) === 1) {
            const checkAssessmentMaster = await selfAssessmentMaster.findAssessmentMaster(gsId, empId).then((data) => {
                return data
            })

            if (!(_.isEmpty(checkAssessmentMaster) || _.isNull(checkAssessmentMaster))) {
                const removeAssessmentMaster = await selfAssessmentMaster.removeSelfAssessmentMaster(gsId, empId).then((data) => {
                    return data
                })
            }

            const selfAssessmentMasterData = {
                sam_gs_id: gsId,
                sam_emp_id: empId,
                sam_status: 0,
                sam_optional: saRequests[0].optional,
                sam_discussion_held_on: saRequests[0].sam_discussion_held_on,
                sam_year: gsData.gs_year

            }
            const addMaster = await selfAssessmentMaster.addSelfAssessmentMaster(selfAssessmentMasterData).then((data) => {
                return data
            })

            if (_.isEmpty(addMaster) || _.isNull(addMaster)) {
                return res.status(400).json(`An error occurred while adding master details`)
            }


            let addResponse;
            let destroyResponse;
            let i = 0;

            const masterId = addMaster.sam_id

            await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                return data
            })

            for (const sa of saRequests) {
                sa.sa_emp_id = empId
                sa.sa_gs_id = gsId
                sa.sa_master_id = masterId
                addResponse = await selfAssessment.addSelfAssessment(sa).then((data) => {
                    return data
                })

                if (_.isEmpty(addResponse) || _.isNull(addResponse)) {
                    destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data) => {
                        return data
                    })

                    destroyResponse = await selfAssessmentMaster.removeSelfAssessmentMaster(gsId, empId).then((data) => {
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
                    return res.status(200).json(addMaster)
                })
            }
        } else {
            return res.status(400).json(`Goal Setting Not Opened`)
        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


router.post('/approve-assessment/:emp_id/:gs_id', auth(), async function (req, res, next) {
    try {
        let empId = parseInt(req.params.emp_id)
        let gsId = parseInt(req.params.gs_id)
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)

        }// else {

            const checkAssessmentMaster = await selfAssessmentMaster.findAssessmentMaster(gsId, empId).then((data) => {
                return data
            })
            const masterId = parseInt(checkAssessmentMaster.sam_id)

            if (_.isEmpty(checkAssessmentMaster) || _.isNull(checkAssessmentMaster)) {
                return res.status(400).json(`No assessment records found`)
            }

            const approveAssessmentMaster = await selfAssessmentMaster.approveSelfAssessmentMaster(empId, gsId, employeeData.emp_supervisor_id).then((data) => {
                return data
            })

            const selfAssessmentList = await selfAssessmentModel.getSelfAssessmentByGoalEmpId(gsId, empId);
            // selfAssessmentList.map(async (list)=>{
            //    await selfAssessmentModel.updateSelfAssessmentStatus(gsId, empId);
            //  })

            const approveAssessment = await selfAssessment.approveSelfAssessmentByMasterId(masterId).then((data) => {
                return data
            })

            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Responded to Goal Setting",
                "log_date": new Date()
            }
            await logs.addLog(logData).then((logRes) => {

                return res.status(200).json(`Action Successful`)
            })

       // }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


/* Approve Self Assessment */
router.post('/approve-assessment/', auth(), async function (req, res, next) {
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
router.get('/prefill-self-assessment/:emp_id', auth(), async function (req, res, next) {
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

        if (_.isEmpty(gsData) || _.isNull(gsData)) {
            return res.status(400).json(`No End of year activity set`)
        }
        const gsId = gsData.gs_id

        const previousEntries = await selfAssessment.findSelfAssessment(gsId, empId).then((data) => {
            return data
        })

        if (_.isEmpty(previousEntries) || _.isNull(previousEntries)) {

            const endYearQuestions = await endYearAssessment.getEndOfYearAssessmentQuestionByGoal(gsId).then((data) => {
                return data
            })

            if (_.isEmpty(endYearQuestions) || _.isNull(endYearQuestions)) {
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
        } else {
            return res.status(400).json(`End of Year Questions already Filled`)
        }

    } catch (err) {
        console.error(`Error while prefilling goals `, err.message);
        next(err);
    }
});

router.patch('/respond-self-assessment/:emp_id/', auth(), async function (req, res, next) {
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
router.get('/get-self-assessment/:emp_id/:gs_id', auth(), async function (req, res, next) {
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

            const openGs = await goalSetting.findOpenGoals().then((r) => {
                return r;
            });

            const selfAssessmentMaster = await selfAssessmentMasterModel.getSelfAssessmentMasterByGoalSettingIdEmpId(gsId, empId)

            let empQuestions = await selfAssessment.findSelfAssessment(gsId, empId).then((data) => {
                return data

            });

            const goals = {
                questions: empQuestions,
                openGoal: openGs,
                master:selfAssessmentMaster
            }
            return res.status(200).json(goals)

        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


/* Update Self Assessment */

router.patch('/update-self-assessment/:emp_id/', auth(), async function (req, res, next) {
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
router.patch('/update-assessment/:emp_id/:gs_id/:masterId', auth(), async function (req, res, next) {
    try {
        const fullUrl = req.headers.referer; //req.protocol + '://' + req.get('host') + req.originalUrl;
        //return res.status(200).json(fullUrl);
        let empId = req.params.emp_id
        let gsId = req.params.gs_id
        let masterId = req.params.masterId
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)

        } else {

            const year = gsData.gs_year

            const goalsYear = await goalSetting.getGoalSettingYear(year).then((data) => {
                return data
            })

            if (_.isEmpty(goalsYear) || _.isNull(year)) {
                return res.status(400).json(`No Goals for the year`)
            }


            const gsIds = []

            for (const goalYear of goalsYear) {
                gsIds.push(goalYear.gs_id)
            }
            //return res.status(200).json(gsIds)

            const schema = Joi.object().keys({
                sa_comment: Joi.string().required(),
                sa_challenge: Joi.string().allow(null),
                sa_accomplishment: Joi.string().allow(null),
                sa_support: Joi.string().allow(null),
                sa_next_step: Joi.string().allow(null),
                sa_update: Joi.string().allow(null),
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
                /* sa.sa_emp_id = empId
                 sa.sa_gs_id = gsId*/
                const saData = {
                    sa_gs_id: gsId,
                    sa_emp_id: empId,
                    sa_comment: sa.sa_comment,
                    sa_master_id: masterId,
                    sa_challenges: sa.sa_challenge,
                    sa_accomplishment: sa.sa_accomplishment,
                    sa_support_needed: sa.sa_support,
                    sa_next_steps: sa.sa_next_step,
                    sa_update: sa.sa_update,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    /*sa.sa_emp_id = empId
                    sa.sa_gs_id = gsId
                    sa.sa_master_id = masterId*/
                }
                addResponse = await selfAssessment.addSelfAssessment(saData).then((data) => {
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
                const subject = "Self assessment update";
                const message = "Your supervisor updated your self-assessment";
                const url = req.headers.referer;
                const notify = await notificationModel.registerNotification(subject, message, empId, 0, url);
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

router.patch('/supervisor-update-self-assessment/:emp_id/', auth(), async function (req, res, next) {
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

router.get('/get-end-questions/:emp_id/:gs_id', auth(), async function (req, res, next) {
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


router.get('/get-self-assessment-master/:empId', auth(), async (req, res) => {
    try {
        const empId = req.params.empId;
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })
        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(`Goal Setting or Employee Does Not exist`)
        }

        const emp = await selfAssessmentMasterModel.getEmployeeSelfAssessment(empId);
        const result = {
            emp,
            //sup
        }
        //return res.status(200).json(sup);
        return res.status(200).json(result);
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again."+e.message);
    }

});

router.post('/process-assessment', auth(), async (req, res) => {
    try {
        const goalId = req.body.goalId;
        const empId = req.body.employee;

        const assessments = await selfAssessmentMasterModel.checkEmployeeAssessment(parseInt(goalId), parseInt(empId));
        if (_.isEmpty(assessments) || _.isNull(assessments)) {
            return res.status(400).json("No self-assessment to process");
        }
        const update = await selfAssessmentMasterModel.updateSelfAssessmentStatus(parseInt(goalId), parseInt(empId));
        return res.status(200).json("Self-assessment processed!");

    } catch (e) {
        return res.status(400).json("Something went wrong. Try again." + e.message);
    }
});

router.get('/get-master-self-assessment/:emp_id/:gs_id', auth(), async (req, res) => {
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

        }
        const checkAssessmentMaster = await selfAssessmentMaster.findAssessmentMaster(gsId, empId).then((data) => {
            return data
        })
        return res.status(200).json(checkAssessmentMaster)

    } catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});

router.get('/get-self-assessment-by-master/:masterId', auth(), async function (req, res, next) {
  try {

    const masterId = req.params.masterId;

    const master = await selfAssessment.getOneSelfAssessmentByMasterId(parseInt(masterId)).then(r=>{
      return r;
    });

    const gsData = await goalSetting.getGoalSetting(parseInt(master.sa_gs_id)).then((data) => {
      return data
    })

    if(_.isEmpty(master) || _.isNull(master)){
      return res.status(400).json("Something went wrong. Try again.");
    } else {
      if (parseInt(gsData.gs_status) === 1 || parseInt(gsData.gs_status) === 0) {
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

         /* const questions = await selfAssessment.getSelfAssessmentQuestionsByMasterId(parseInt(masterId)).then(res=>{
            return res;
          });*/
         /* for (const gs of gss) {
            gsIdArray.push(gs.gs_id)
          }*/

          /*let questionData = await selfAssessment.findSelfAssessmentQuestions(empId, gsIdArray).then((data) => {
            return data
          })*/
          const questions = await selfAssessment.getSelfAssessmentQuestionsByMasterId(parseInt(masterId)).then(res=>{
            return res;
          });
          const openGs = await goalSetting.findOpenGoals().then((r) => {
            return r;
          });
          const selfAssessmentMaster = await selfAssessmentMasterModel.getSelfAssessmentMasterByGoalSettingIdEmpId(parseInt(master.sa_gs_id), parseInt(master.sa_emp_id));

          let employeeRating = await endYearRating.findEmployeeRating(parseInt(master.sa_emp_id), currentYear).then((data) => {
            return data
          })
          //return res.status(200).json(questions);
          if (!(_.isEmpty(employeeRating) || _.isNull(employeeRating))) {
            ratingStatus = 1
            ratingDetails = employeeRating

          }

          const resData = {
            question: questions,
            year: currentYear,
            ratingStatus: ratingStatus,
            ratingDetails: ratingDetails,
            openGoal: openGs,
            master:selfAssessmentMaster
          }
          return res.status(200).json(resData);
        }


      } else {
        return res.status(400).json(`Goal Setting Not Opened`)
      }

    }







  } catch (err) {
    return res.status(400).json(`Error while Responding to Goals `);
    next(err);
  }
});

router.get('/get-all-self-assessments', auth(), async function(req, res){
  try{
    const assessments = await selfAssessmentMasterModel.getAllSelfAssessments().then(res=>{
      return res;
    })
    return res.status(200).json(assessments);
  }catch (e) {
    return res.status(400).json("Could not retrieve self-assessments"+e.message);
  }
});

router.get('/get-all-emp-self-assessments/:empId/:year', auth(), async function(req, res){
  try{
    const year = req.params.year;
    const empId = req.params.empId;
    const assessments = await selfAssessmentMasterModel.getAllEmployeeSelfAssessments(parseInt(empId), year).then(res=>{
      return res;
    })
    return res.status(200).json(assessments);
  }catch (e) {
    return res.status(400).json("Could not retrieve self-assessments"+e.message);
  }
});

router.get('/get-self-assessments-status/:status', auth(), async function(req, res){
  try{
    const status = req.params.status;
    const assessments = await selfAssessmentMasterModel.getAllSelfAssessmentsByStatus(status);
    return res.status(200).json(assessments);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.")
  }
});

module.exports = router;
