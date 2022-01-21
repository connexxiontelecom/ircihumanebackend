const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSetting =  require('../services/goalSettingService');
const selfAssessment =  require('../services/selfAssessmentService');
const employees = require('../services/employeeService');
const logs = require('../services/logService')

/* Add Self Assessment */
router.post('/add-self-assessment/:emp_id/:gs_id', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        let gsId = req.params.gs_id
        const employeeData = await employees.getEmployee(empId).then((data)=>{
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data)=>{
            return data
        })

        if(_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)){
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)

        }else{

            if(parseInt(gsData.gs_status) === 1){
                const schema = Joi.object().keys({
                    sa_comment: Joi.string().required(),
                })
                const schemas = Joi.array().items(schema)
                const saRequests = req.body

                let validationResult = schemas.validate( saRequests )
                if(validationResult.error){
                    return res.status(400).json(validationResult.error.details[0].message)
                }
                let addResponse;
                let destroyResponse;
                let i = 0;
                for(const sa of saRequests){
                    sa.sa_emp_id = empId
                    sa.sa_gs_id = gsId
                    addResponse = await selfAssessment.addSelfAssessment(sa).then((data)=>{
                        return data
                    })

                    if(_.isEmpty(addResponse) || _.isNull(addResponse)){
                        destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data)=>{
                            return data
                        })

                        i++;
                        break
                    }

                }

                if(i > 0){
                    return res.status(400).json(`An error Occurred while adding`)
                }
                else{
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Responded to Goal Setting",
                        "log_date": new Date()
                    }
                    await logs.addLog(logData).then((logRes)=>{

                        return  res.status(200).json(`Action Successful`)
                    })

                }
            }
            else{
                return res.status(400).json(`Goal Setting Not Opened`)
            }



        }


     } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});

/* Pre Fill Self Assessment  */
router.get('/prefill-self-assessment/:emp_id/:gs_id', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        let gsId = req.params.gs_id

        const employeeData = await employees.getEmployee(empId).then((data)=>{
            return data
        })


        const gsData = await goalSetting.getGoalSetting(gsId).then((data)=>{
            return data
        })


        if(_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)){
            return res.status(400).json(`Goal Setting or Employee Does Not exist`)

        }else{
            if(parseInt(gsData.gs_status) === 1){

                let latestClosedGoal = await goalSetting.findLatestClosedGoal().then((data)=>{
                    return data
                })

                if(_.isEmpty(latestClosedGoal) || _.isNull(latestClosedGoal)){
                    return res.status(400).json(`No Previous Goal Setting`)
                }
                else{
                    let latestClosedGoalId = latestClosedGoal.gs_id
                    let latestClosedGoalActivity = latestClosedGoal.gs_activity

                    if(parseInt(gsData.gs_activity) === 2 && parseInt(latestClosedGoalActivity) === 1){
                       await selfAssessment.findSelfAssessment(latestClosedGoalId, empId).then((data)=>{
                            return res.status(200).json(data)
                        })


                    }


                }

            }
            else{
                return res.status(400).json(`Goal Setting Not Opened`)
            }

        }


    } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


module.exports = router;
