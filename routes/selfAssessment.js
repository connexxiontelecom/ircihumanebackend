const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const goalSetting =  require('../services/goalSettingService');
const selfAssessment =  require('../services/selfAssessmentService');
const employees = require('../services/employeeService');
const logs = require('../services/logService')
const endYearAssessment = require('../services/endOfYearAssessmentService')

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
                    let finalGsData = {}
                    if(parseInt(gsData.gs_activity) === 1){
                        finalGsData.goalSetting = gsData
                        return res.status(200).json(finalGsData)
                    }

                    if(parseInt(gsData.gs_activity) === 2 && parseInt(latestClosedGoalActivity) === 1){
                       await selfAssessment.findSelfAssessment(latestClosedGoalId, empId).then((data)=>{
                           finalGsData.goalSetting = gsData
                           finalGsData.questions = data
                            return res.status(200).json(finalGsData)
                        })
                    }

                    if(parseInt(gsData.gs_activity) === 3 && parseInt(latestClosedGoalActivity) === 2){
                    let currentYear = gsData.gs_year;
                    //fetch questions from end of year

                        const endYearQuestions = await endYearAssessment.getEndOfYearAssessmentQuestionByGoal(gsData.gs_id).then((data)=>{
                            return data
                        })

                        if(_.isEmpty(endYearQuestions) || _.isNull(endYearQuestions)){
                            return  res.status(400).json(`No End of year questions set yet`)
                        }

                        else{

                            let empQuestions =  await selfAssessment.findSelfAssessment(gsId, empId).then((data)=>{
                                return  data

                            })

                          if(_.isEmpty(empQuestions) || _.isNull(empQuestions)){

                              let eyaObject
                              let addResponse
                              let destroyResponse
                              let i = 0;
                              for(const eya of endYearQuestions){
                                  eyaObject = {
                                      sa_gs_id: gsId,
                                      sa_emp_id: empId,
                                      sa_comment: eya.eya_question,
                                      sa_eya_id: eya.eya_id
                                  }

                                  //insert into self assessment
                                  addResponse = await selfAssessment.addSelfAssessmentEndYear(eyaObject).then((data) => {
                                      return data
                                  })

                                  if(_.isNull(addResponse) || _.isEmpty(addResponse)){
                                      i++
                                      destroyResponse = await selfAssessment.removeSelfAssessment(gsId, empId).then((data)=>{
                                          return data
                                      })
                                      break
                                  }
                              }

                              if( i > 0){
                                  destroyResponse = selfAssessment.removeSelfAssessment(gsId, empId).then((data)=>{
                                      return data
                                  })

                                  return  res.status(400).json(`There was an error while fetching questions`)

                              }


                              let gss = await goalSetting.getGoalSettingYear(currentYear).then((data)=>{
                                  return data
                              })

                              if(_.isEmpty(gss) || _.isNull(gss)){
                                  return res.status(404).json(`No Goal Setting found`)
                              }
                              else{

                                  let gsIdArray = [ ]

                                  for (const gs of gss){
                                      gsIdArray.push(gs.gs_id)
                                  }

                                  let questionData = await selfAssessment.findSelfAssessmentQuestions(empId, gsIdArray).then((data)=>{
                                      return data
                                  })


                                  finalGsData.goalSetting = gsData
                                  finalGsData.questions = questionData
                                  return res.status(200).json(finalGsData)

                              }


                          }

                        else{
                              let gss = await goalSetting.getGoalSettingYear(currentYear).then((data)=>{
                                  return data
                              })
                              if(_.isEmpty(gss) || _.isNull(gss)){
                                  return res.status(404).json(`No Goal Setting found`)
                              }
                              else{

                                  let gsIdArray = [ ]

                                  for (const gs of gss){
                                      gsIdArray.push(gs.gs_id)
                                  }

                                  let questionData = await selfAssessment.findSelfAssessmentQuestions(empId, gsIdArray).then((data)=>{
                                      return data
                                  })


                                  finalGsData.goalSetting = gsData
                                  finalGsData.questions = questionData
                                  return res.status(200).json(finalGsData)

                              }

                          }

                        }

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

router.patch('/respond-self-assessment/:emp_id/', auth,  async function(req, res, next) {
    try {
        let empId = req.params.emp_id


        const employeeData = await employees.getEmployee(empId).then((data)=>{
            return data
        })



        if(_.isEmpty(employeeData) || _.isNull(employeeData)){
            return res.status(400).json(` Employee Does Not exist`)

        }else{

            const schema = Joi.object().keys({
                sa_id: Joi.number().required(),
                sa_response: Joi.string().required(),

            })
            const schemas = Joi.array().items(schema)
            const selfAssessmentRequests = req.body

            let validationResult = schemas.validate( selfAssessmentRequests )
            if(validationResult.error){
                return res.status(400).json(validationResult.error.details[0].message)
            }

            for(const sa of selfAssessmentRequests){
               await selfAssessment.respondSelfAssessment(sa.sa_id, sa.sa_response).then((data)=>{
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



module.exports = router;
