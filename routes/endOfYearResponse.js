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
const selfAssessmentMaster = require("../services/selfAssessmentMasterService");
const {sequelize, Sequelize} = require('../services/db');
const endYearSupervisorResponse = require('../models/endyearsupervisorresponse')(sequelize, Sequelize.DataTypes);
const selfassessmentMasterModel = require('../models/selfassessmentmaster')(sequelize, Sequelize.DataTypes);
const mailer = require('../services/IRCMailer')

/* Add end of year question Assessment */
router.get('/', auth(), async function (req, res, next) {
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
router.get('/prefill-end-year/:emp_id', auth(), async function (req, res, next) {
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
router.post('/add-question/:emp_id/:gs_id', auth(), async function (req, res, next) {
    let destroyResponse;
    let addResponse;
    try {

        let empId = parseInt(req.params.emp_id)
        let gsId = parseInt(req.params.gs_id)
        let eyrRequests = req.body
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        let gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)

        }

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
                sam_optional: 'null',
                sam_discussion_held_on: req.body.sam_discussion_held_on,
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

            await endYearResponse.removeResponse(empId, gsId).then((data) => {
                return data
            })

            for (const er of eyrRequests) {

                const eyrObjectAdd = {
                    eyr_master_id: masterId,
                    eyr_goal: er.eyr_goal,
                    eyr_reflection: er.eyr_reflection,
                    eyr_type: er.eyr_type,
                    eyr_emp_id: empId,
                    eyr_gs_id: gsId,
                    eyr_strength: er.eyr_strength,
                    eyr_growth_area: er.eyr_growth_area,
                    eyr_support_growth_area: er.eyr_support_growth_area,
                    eyr_response: er.eyr_response,
                    eyr_status: 0,
                }

                addResponse = await endYearResponse.addEndOfYearResponse(eyrObjectAdd).then((data) => {
                    return data
                })

                if (_.isEmpty(addResponse) || _.isNull(addResponse)) {
                    destroyResponse = await endYearResponse.removeResponse(empId, gsId).then((data) => {
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
              //send email notification
                //employee
                if(!(_.isEmpty(employeeData.emp_office_email)) || !(_.isNull(employeeData.emp_office_email)) ){
                  const message = `Thank you for submitting your end of year assessment. We'll do well to notify your supervisor. `;
                  notify("Self Assessment", message, employeeData);
                }
                //supervisor
                const supervisorData = await employees.getEmployee(employeeData.emp_supervisor_id).then((data) => {
                  return data
                })
                if(!(_.isEmpty(supervisorData.emp_office_email)) || !(_.isNull(supervisorData.emp_office_email)) ){
                  const text = `${employeeData.emp_first_name} - (${employeeData.emp_unique_id}) submitted his/her end of year assessment a while ago. Do well to login to assess employee.`;
                  notify("Assess Employee", text, supervisorData);
                }

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


        const eyaRequests = req.body
        // let addResponse;
        // let destroyResponse;
        // let gsData;
        // let i = 0;
        // let gsId;


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

        let i;
        if (i > 0) {

            return res.status(400).json(`An error Occurred, Check for Open End of Activity`)
        } else {

          //employee
          if(!(_.isEmpty(employeeData.emp_office_email)) || !(_.isNull(employeeData.emp_office_email)) ){
            const message = `Thank you for submitting your end of year assessment. We'll do well to notify your supervisor. `;
            notify("Assess Employee", message, employeeData);
          }
          //supervisor
          const supervisorData = await employees.getEmployee(employeeData.emp_supervisor_id).then((data) => {
            return data
          })
          if(!(_.isEmpty(supervisorData.emp_office_email)) || !(_.isNull(supervisorData.emp_office_email)) ){
            const text = `${employeeData.emp_first_name} - (${employeeData.emp_unique_id}) submitted his/her end of year assessment a while ago. Do well to login to assess employee.`;
            notify("Assess Employee", text, supervisorData);
          }
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



router.get('/get-end-year/:emp_id/:gs_id', auth(), async function (req, res, next) {
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
        }

        const endYearResponses = await endYearResponse.getEndOfYearResponse(gsId, empId).then((data) => {
            return data
        })
        return res.status(200).json(endYearResponses)

    } catch (err) {
        console.error(`Error while Adding Questions `, err.message);
        next(err);
    }
});

router.post('/approve-end-year/:emp_id/:gs_id', auth(), async function (req, res, next) {
    try {
        let empId = parseInt(req.params.emp_id)
        let gsId = parseInt(req.params.gs_id)


        const schema = Joi.object({
            eyr_rating: Joi.string().required(),
        })

        const gsRequest = req.body
        const validationResult = schema.validate(gsRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const rating = gsRequest.eyr_rating

        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        const gsData = await goalSetting.getGoalSetting(gsId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData) || _.isNull(gsData) || _.isEmpty(gsData)) {
            return res.status(400).json(`Employee or Goal Setting  Does Not exist`)
        }

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


        const approveEndOfYear = await endYearResponse.approveEndYearResponseByMasterId(masterId).then((data) => {
            return data
        })

        const rateEmployee = await endYearResponse.rateEmployeeByMasterId(masterId, rating).then((data)=>{
            return data
        })


        //employee
        if(!(_.isEmpty(employeeData.emp_office_email)) || !(_.isNull(employeeData.emp_office_email)) ){
          const message = `Your end of year assessment was approved! `;
          notify("Good News!", message, employeeData);
        }
        //supervisor
        const supervisorData = await employees.getEmployee(employeeData.emp_supervisor_id).then((data) => {
          return data
        })
        if(!(_.isEmpty(supervisorData.emp_office_email)) || !(_.isNull(supervisorData.emp_office_email)) ){
          const text = `Hello ${supervisorData.emp_first_name} - (${supervisorData.emp_unique_id}), you approved ${employeeData.emp_first_name} - (${employeeData.emp_unique_id}) end of year assessment a while ago. Contact admin if this was done in error. Thank you.`;
          notify("End of Year Assessment Approved!", text, supervisorData);
        }


        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Responded to End of Year",
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


router.post('/supervisor-end-year-response', auth(), async function(req, res){
  try{
    const schema = Joi.object({
      strength: Joi.string().required(),
      rating: Joi.string().required(),
      master: Joi.number().required(),
      growth_area: Joi.string().required(),
      additional_comment: Joi.string().allow(null),
      eyr_support_growth_area: Joi.string().allow(null),
      approve: Joi.number().required(),
      supervisor: Joi.number().required(),
      employee: Joi.number().required(),
      gsId: Joi.number().required(),
      sam_discussion_held_on: Joi.string().required(),
    })
    const supRequest = req.body
    const validationResult = schema.validate(supRequest, {abortEarly: false});


    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const {strength, rating, master,eyr_support_growth_area,
      growth_area, additional_comment,
      approve, supervisor, employee, gsId, } = supRequest;
      let approve_status = approve === 1 ? 1 : 0;
    const data = {
      eysr_strength: strength,
      eyr_support_growth_area:eyr_support_growth_area,
      eysr_growth: growth_area,
      eysr_rating:rating,
      eysr_master_id:master,
      eysr_additional_comment: additional_comment,
      eysr_supervisor_id:supervisor,
      eysr_status: approve_status
    }
    let submission;

    const masterRecord = await endYearSupervisorResponse.getSupervisorEndYearResponseByMasterIdOnly(parseInt(master));
    if(_.isEmpty(masterRecord) || _.isNull(masterRecord)){
       submission = await endYearSupervisorResponse.addSupervisorEndYearResponse(data).then(res=>{
        return res;
      });
    }else{
       submission = await endYearSupervisorResponse.updateSupervisorEndYearResponse(data, parseInt(master));
    }

    const dis = await selfAssessmentMaster.updateDiscussionHeldOnSelfAssessmentMaster(parseInt(employee), parseInt(gsId), req.body.sam_discussion_held_on);

    if(parseInt(approve) === 1){
      const updateMaster = await selfAssessmentMaster.approveSelfAssessmentMaster(parseInt(employee), parseInt(gsId), parseInt(supervisor)).then(res=>{
        return res;
      });
      if(!(_.isEmpty(updateMaster)) || !(_.isNull(updateMaster))){
        const updateEndYear = await endYearResponse.approveEndYearResponseByMasterId(parseInt(master)).then(newRes=>{
          return newRes;
        })
        if(_.isEmpty(updateEndYear) || _.isNull(updateEndYear)){
          return res.status(400).json("Could not update end of year status. Try again later.");
        }else{
          return res.status(200).json('Action successful.');
        }
      }
    }


    return res.status(200).json(submission);

  }catch (e) {
    return res.status(400).json("Something went wrong. Try again."+e.message);
  }
});

router.get('/supervisor-end-year-response/:masterId', auth(), async function(req, res){
  try{
    const masterId = req.params.masterId;

    const result = await endYearSupervisorResponse.getSupervisorEndYearResponseByMasterIdOnly(parseInt(masterId));
    //const result = await endYearSupervisorResponse.getSupervisorEndYearResponseByMasterId(parseInt(masterId));
    if(_.isEmpty(result) || _.isNull(result)){
      return res.status(200).json("Awaiting supervisor's response.");
    }else{
      return res.status(200).json(result);
    }
  }catch (e) {
    return res.status(400).json("Something went wrong.");
  }
})


async function notify(subject, message, userData){
    const mailerRes =  await mailer.sendMail('noreply@ircng.org', userData.emp_office_email, subject, message).then((data)=>{
      return data
    })
}
const userData = {
  emp_office_email:'talktojoegee@gmail.com'
};
notify('Test', 'Hello Joe', userData)

module.exports = router;
