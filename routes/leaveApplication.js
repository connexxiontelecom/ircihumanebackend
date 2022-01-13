const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const {format} = require('date-fns');
const  differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const isBefore = require('date-fns/isBefore')
const leaveApplication =  require('../services/leaveApplicationService')
const { addLeaveAccrual, computeLeaveAccruals } = require("../routes/leaveAccrual")
const logs = require('../services/logService')


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
            return  res.status(400).json('Leave start date cannot be before today')
        }else{
            if(String(startYear) === String(endYear)){

                let daysRequested =  await differenceInBusinessDays(endDate, startDate)

                if(parseInt(daysRequested) >= 1) {

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

                                return res.status(200).json(`${accruedDays} ${sumLeave}`)
                                if (parseInt(daysRequested) > (parseInt(accruedDays) - parseInt(sumLeave))) {
                                    return res.status(400).json("Days Requested Greater than Accrued Days")
                                } else {

                                    leaveApplicationRequest['leapp_year'] = startYear
                                    leaveApplicationRequest['leapp_total_days'] = daysRequested
                                    leaveApplicationRequest['leapp_status'] = 0;
                                    leaveApplication.addLeaveApplication(leaveApplicationRequest).then((data) => {
                                        return res.status(200).json('Action Successful')
                                    })


                                }

                            })

                        }



                    })


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

/* Update Location Allowance */
// router.patch('/update-location-allowance/:la_id', auth,  async function(req, res, next) {
//     try {
//
//         const schema = Joi.object( {
//             la_payment_id: Joi.number().required(),
//             la_location_id: Joi.number().required(),
//             la_amount: Joi.number().precision(2).required()
//
//         })
//         const locationAllowanceRequest = req.body
//         const validationResult = schema.validate(locationAllowanceRequest)
//         if(validationResult.error){
//             return res.status(400).json(validationResult.error.details[0].message)
//         }
//         await locationAllowance.findLocationAllowanceByPaymentIdLocationId(locationAllowanceRequest.la_payment_id, locationAllowanceRequest.la_location_id).then((data) =>{
//             if(_.isEmpty(data)){
//                 locationAllowance.findLocationAllowanceById(req.params['la_id']).then((data)=>{
//                     if(_.isEmpty(data)){
//                         return res.status(404).json(`Location Allowance Does Not Exist`)
//                     }
//                     else{
//                         locationAllowance.updateLocationAllowance(locationAllowanceRequest, req.params['la_id']).then((data)=>{
//                             const logData = {
//                                 "log_user_id": req.user.username.user_id,
//                                 "log_description": "Updated Tax Rate",
//                                 "log_date": new Date()
//                             }
//                             logs.addLog(logData).then((logRes)=>{
//                                 //return res.status(200).json(logRes);
//                                 return  res.status(200).json(`Location Allowance Updated`)
//                             })
//                         })
//                     }
//                 })
//               }else{
//                 if(parseInt(req.params['la_id']) === parseInt(data.la_id)){
//                     locationAllowance.updateLocationAllowance(locationAllowanceRequest, req.params['la_id']).then((data)=>{
//                         const logData = {
//                             "log_user_id": req.user.username.user_id,
//                             "log_description": "Updated Tax Rate",
//                             "log_date": new Date()
//                         }
//                         logs.addLog(logData).then((logRes)=>{
//                             //return res.status(200).json(logRes);
//                             return  res.status(200).json(`Location Allowance Updated`)
//                         })
//                     })
//                 }else{
//                     return res.status(400).json(`Location Allowance Update Not Allowed`)
//                 }
//             }
//         })
//     } catch (err) {
//         console.error(`Error while updating Location Allowance`, err.message);
//         next(err);
//     }
// });
//

module.exports = router;
