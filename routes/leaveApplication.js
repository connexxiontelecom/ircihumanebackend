const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const {format} = require('date-fns');
const  differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const isBefore = require('date-fns/isBefore')
const leaveApplication =  require('../services/leaveApplicationService')
const { addLeaveAccrual, computeLeaveAccruals } = require("../routes/leaveAccrual");
const authorizationAction = require('../services/authorizationActionService');
const supervisorAssignmentService = require('../services/supervisorAssignmentService');
const logs = require('../services/logService')
const employees = require("../services/employeeService");


/* Get leave application */
router.get('/', auth, async function(req, res, next) {
    try {
        await leaveApplication.findAllLeaveApplication().then((data) =>{
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching leaves ${err.message}`)
    }
});

/* Add Location Allowance */
router.post('/add-leave-application', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            leapp_empid: Joi.number().required(),
            leapp_leave_type: Joi.number().required(),
            leapp_start_date: Joi.string().required(),
            leapp_end_date: Joi.string().required(),
            // leapp_verify_by: Joi.number().required(),
            // leapp_verify_date: Joi.string().required(),
            // leapp_verify_comment: Joi.string().required(),
            // leapp_recommend_by: Joi.number().required(),
            // leapp_recommend_date: Joi.string().required(),
            // leapp_recommend_comment: Joi.string().required(),
            // leapp_approve_by: Joi.number().required(),
            // leapp_approve_date: Joi.string().required(),
            // leapp_approve_comment: Joi.string().required(),
            // leapp_status: Joi.string().required(),
                     })

        const leaveApplicationRequest = req.body
        const validationResult = schema.validate(leaveApplicationRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }


        let startDate = new Date(leaveApplicationRequest.leapp_start_date);
        let startYear = startDate.getFullYear();

        let endDate = new Date(leaveApplicationRequest.leapp_end_date);
        let endYear = endDate.getFullYear();

        if(isBefore(startDate, new Date()) ){
            return  res.status(400).json('Leave start date cannot be before today or today')
        }else{
            if(String(startYear) === String(endYear)){
                let daysRequested =  await differenceInBusinessDays(endDate, startDate)
                const empId = req.user.username.user_id;
                if(parseInt(daysRequested) >= 1) {
                    supervisorAssignmentService.getEmployeeSupervisor(leaveApplicationRequest.leapp_empid).then((val)=>{
                        if(!(_.isEmpty(val) || _.isNull(val))){
                            const accrualData = {
                                lea_emp_id: leaveApplicationRequest.leapp_empid,
                                lea_year: startYear,
                                lea_leave_type: leaveApplicationRequest.leapp_leave_type,

                            }

                            computeLeaveAccruals(accrualData).then((accruedDays) => {
                                if(_.isNull(accruedDays) || parseInt(accruedDays) === 0){
                                    return  res.status(400).json('No Leave Accrued for Selected Leave')
                                }else{
                                    leaveApplication.sumLeaveUsedByYearEmployeeLeaveType(startYear, leaveApplicationRequest.leapp_empid, leaveApplicationRequest.leapp_leave_type).then((sumLeave) => {

                                        // return res.status(200).json(`${accruedDays} ${sumLeave}`)
                                        if (parseInt(daysRequested) > (parseInt(accruedDays) - parseInt(sumLeave))) {
                                            return res.status(400).json("Days Requested Greater than Accrued Days")
                                        } else {

                                            leaveApplicationRequest['leapp_year'] = startYear
                                            leaveApplicationRequest['leapp_total_days'] = daysRequested
                                            leaveApplicationRequest['leapp_status'] = 0;
                                            leaveApplication.addLeaveApplication(leaveApplicationRequest).then((data) => {
                                                //Register authorization
                                                const leaveAppId = data.leapp_id;
                                                authorizationAction.registerNewAction(1,leaveAppId, val.sa_supervisor_id,0,"Leave application initiated");
                                                return res.status(200).json('Action Successful')
                                            })


                                        }

                                    })
                                }
                            })

                        }
                        else{
                            return  res.status(400).json( 'You currently have no supervisor assigned to you. Contact admin.');
                        }
                    });
                }else{
                    return  res.status(400).json('Leave duration must be greater or equal to 1')
                }

            }

            else{
                return  res.status(400).json('Leave period must be within the same year')

            }
        }


    } catch (err) {
        console.error(`Error while adding location allowance `, err.message);
        next(err);
    }
});


/* Get Employee Leave application */
router.get('/get-employee-leave/:emp_id', auth, async function(req, res, next) {
    try {

        let empId = req.params['emp_id']
        await employees.getEmployee(empId).then((data)=>{
            if(_.isEmpty(data)){
                return res.status(404).json(`Employee Doesn't Exist`)
            }else{
                leaveApplication.findEmployeeLeaveApplication(empId).then((data) =>{
                    return res.status(200).json(data);
                })
            }
        })

    } catch (err) {
        return res.status(400).json(`Error while fetching leaves ${err.message}`)
    }
});
module.exports = router;
