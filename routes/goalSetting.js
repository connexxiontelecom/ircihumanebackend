const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSetting = require('../services/goalSettingService');
const goalSettingLog = require('../services/goalSettingLogService');
const goalSettingYear = require('../services/goalSettingYearService');
const employees = require('../services/employeeService');
const logs = require('../services/logService')


/* Get All goals setting */
router.get('/', auth(), async function (req, res, next) {
    try {
        await goalSetting.findGoals().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching goal settings ${err.message}`)
    }
});

router.get('/get-open-goal-setting', auth(), async function (req, res, next) {
    try {
        await goalSetting.findOpenGoals().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching goal settings ${err.message}`)
    }
});

router.get('/get-open-end-Year', auth(), async function (req, res, next) {
    try {
        await goalSetting.findEndYearGoals().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching goal settings ${err.message}`)
    }
});

/* Add goal */
router.post('/add-goal-setting', auth(), async function (req, res, next) {
    try {
        //check if year from date equals year entered,
        // check if from date is not greater than to date

        const schema = Joi.object({
            gs_activity: Joi.string().required(),
        })

        const gsRequest = req.body
        const validationResult = schema.validate(gsRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const goalSettingYearData = await goalSettingYear.getGoalSettingYear().then((data) => {
            return data
        })

        if (_.isEmpty(goalSettingYearData) || _.isNull(goalSettingYearData)) {
            return res.status(400).json(`No goal Setting Year Set Up`)
        }

        // const from = gsRequest.gs_from
        // const fromYear = from.getFullYear()
        //const to = gsRequest.gs_to
        // const toYear = to.getFullYear()
        const year = goalSettingYearData.gsy_year
        const from = goalSettingYearData.gsy_from
        const to = goalSettingYearData.gsy_to

        const goalSettingActivityYear = await goalSetting.findGoalSetting(gsRequest.gs_activity, year).then((data) => {
            return data
        })
        if (_.isEmpty(goalSettingActivityYear) || _.isNull(goalSettingActivityYear)) {
            if (parseInt(gsRequest.gs_activity) === 2) {
                const goalSettingActivityYear = await goalSetting.findGoalSetting(1, year).then((data) => {
                    return data
                })

                if (_.isEmpty(goalSettingActivityYear) || _.isNull(goalSettingActivityYear)) {
                    return res.status(400).json("Beginning of year activity not yet set")
                }
            }


            if (parseInt(gsRequest.gs_activity) === 3) {
                const goalSettingActivityYear = await goalSetting.findGoalSetting(2, year).then((data) => {
                    return data
                })

                if (_.isEmpty(goalSettingActivityYear) || _.isNull(goalSettingActivityYear)) {
                    return res.status(400).json("Mid Year Checking of year activity not yet set")
                }
            }

            const activeGoalsYear = await goalSetting.findActiveGoal(year).then((data) => {
                return data
            })

            if (!(_.isEmpty(activeGoalsYear) && _.isNull(activeGoalsYear))) {
                const closeAllGoals = await goalSetting.closeAllGoals().then((data) => {
                    return data
                })
            }

            let goalSettingObject = {
                gs_from: from,
                gs_to: to,
                gs_activity: gsRequest.gs_activity,
                gs_year: year,
                gs_status: 1,
            }

            let addGoalSettingData = await goalSetting.addGoalSetting(goalSettingObject).then((data) => {
                return data
            })

            if (_.isEmpty(addGoalSettingData) || _.isNull(addGoalSettingData)) {
                return res.status(400).json("An Error Occurred while adding goals")
            } else {

                let goalSettingLogObject = {
                    gsl_activity: gsRequest.gs_activity,
                    gsl_year: year,
                    gsl_status: 1
                }

                await goalSettingLog.addGoalSettingLog(goalSettingLogObject).then((data) => {

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

        } else {
            return res.status(400).json("Goal Setting for specific year and activity already announced")
        }
    } catch (err) {
        console.error(`Error setting goals `, err.message);
        next(err);
    }
});

/* Close Goal  */

router.patch('/close-goal-setting/:gs_id', auth(), async function (req, res, next) {
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

        const openGs = await goalSetting.findOpenGoals();
        openGs.map(async (gs)=>{
          await goalSetting.updateGoalSettingStatus(gs.gs_id, 0);
        })
        let status = null;
        if(parseInt(req.body.gs_status) === 0){
          status = 1;
        }else if(parseInt(req.body.gs_status) === 1){
          status = 0;
        }
        await goalSetting.updateGoalSettingStatus(gsId, status).then((data) => {
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

router.get('/get-goal-setting-by-fy/:fy', auth(), async  function(req, res){

  const fy = req.params.fy;
  try {
    const fys = await goalSetting.getGoalSettingYear(fy);
    const obj = {
      goalYears:fys
    }
    return res.status(200).json(obj);
  } catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
});
module.exports = router;
