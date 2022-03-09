const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const variationalPayment =  require('../services/variationalPaymentService');
const paymentDefinition =  require('../services/paymentDefinitionService');
const payrollMonthYear =  require('../services/payrollMonthYearService');
const timesheetPenaltyService =  require('../services/timesheetPenaltyService');
const timesheetPenaltyModel =  require('../models/TimeSheetPenalty');
const employees = require('../services/employeeService');
const logs = require('../services/logService')
const salary = require("../services/salaryService");
const {sequelize} = require("../services/db");


/* Get All variational payments */
router.get('/', auth, async function(req, res, next) {
    try {
        await variationalPayment.getVariationalPayments().then((data) =>{
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching variational payments`)
    }
});

router.post('/', auth, async (req, res, next)=>{
    try{
        // const scheme = Joi.array().items(Joi.object().keys({
        //     name: Joi.string().required(),
        //     value: Joi.required()
        // }).unknown(true)).unique((a, b) => a.name === b.name)
        //
        //
        // const schema = Joi.object({
        //     employee: Joi.array().items(Joi.number().required()),
        //     payment_definition:Joi.number().required(),
        //     amount:Joi.number().required(),
        //     month:Joi.number().required(),
        //     year:Joi.number().required()
        // });

        const vpRequest = req.body
        //const validationResult = schema.validate(vpRequest)
        // if(validationResult.error) {
        //     return res.status(400).json(validationResult.error.details[0].message);
        // }

        //return  res.status(200).json(vpRequest)

        const salaryRoutineCheck = await salary.getSalaryMonthYear(req.body.month, req.body.year).then((data)=>{
            return data
        })

        if(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)){

            let employeeId = req.body.employee
            let payments = req.body.payments

            const employeeData = await employees.getEmployee(employeeId).then((data) => {
                return data
            })
            if (!(_.isNull(employeeData) || _.isEmpty(employeeData))) {

                for (const payment of payments) {
                    const checkExisting = await variationalPayment.checkDuplicateEntry(parseInt(employeeId), parseInt(req.body.year), parseInt(req.body.month), parseInt(payment.payment_definition)).then((data) => {
                        return data
                    })

                    if (!(_.isNull(checkExisting) || _.isEmpty(checkExisting))) {
                        if((parseInt(checkExisting.vp_confirm) === 0) || (parseInt(checkExisting.vp_confirm) === 2 )){
                            await variationalPayment.deletePaymentEntry(checkExisting.vp_id).then()
                        }else{

                            return res.status(400).json(`${checkExisting.payment.pd_payment_name} already actioned for employee, consider updating`)
                        }

                    }

                if(parseFloat(payment.amount) > 0){
                    const vpObject = {
                        vp_emp_id: parseInt(employeeId),
                        vp_payment_def_id: parseInt(payment.payment_definition),
                        vp_amount: parseFloat(payment.amount),
                        vp_payment_month: parseInt(req.body.month),
                        vp_payment_year: parseInt(req.body.year)
                    }
                    await variationalPayment.setNewVariationalPayment(vpObject).then()
                }

                }

                return res.status(200).json('Action Successful')

            } else {
                return res.status(404).json('Employee Does not Exists')
            }

        }else {
            return res.status(400).json("Payroll Routine already run for this period");

        }

        // const payrollR = 0;
        // if(payrollR === 1){
        //     return res.status(400).json("You cannot run payroll routine for this period");
        // }
        // else{
        //
        //
        //     const pdId = await paymentDefinition.findPaymentById(req.body.payment_definition).then((data)=>{
        //         return  data;
        //     });
        //
        //     if(parseInt(pdId.pd_payment_variant) !== 1) return res.status(400).json('Choose variational payment from the option provided.');
        //
        //     let employeesIds = req.body.employee
        //     for (const emp of employeesIds) {
        //         const employeeData =  await employees.getEmployee(emp).then((data)=>{
        //             return data
        //         })
        //         if(!(_.isNull(employeeData) || _.isEmpty(employeeData))){
        //
        //             const checkExisting = await variationalPayment.checkDuplicateEntry(parseInt(emp), parseInt(req.body.year), parseInt(req.body.month), parseInt(req.body.payment_definition)).then((data)=>{
        //                 return data
        //             })
        //
        //             if(!(_.isNull(checkExisting) || _.isEmpty(checkExisting))){
        //                     await variationalPayment.deletePaymentEntry(checkExisting.vp_id).then()
        //             }
        //           const vpObject = {
        //               vp_emp_id: parseInt(emp),
        //               vp_payment_def_id: parseInt(req.body.payment_definition),
        //               vp_amount:  parseFloat(req.body.amount),
        //               vp_payment_month:  parseInt(req.body.month),
        //               vp_payment_year:  parseInt(req.body.year)
        //           }
        //           await variationalPayment.setNewVariationalPayment(vpObject).then()
        //        }
        //     }
        //     return res.status(200).json('Action Successful')
        // }

    }catch (e) {
        return res.status(400).json(`Error while posting variational payment.${e.message}`);
    }
});

router.post('/single-payment', auth, async (req, res)=>{
    try{
        const requestBody = req.body;
        const payroll = await payrollMonthYear.findPayrollMonthYear().then((res)=>{
            return res;
        });

        if(_.isEmpty(payroll) || _.isNull(payroll)){
            return res.status(400).json("There's currently no payroll record");
        }
      const salaryRoutineCheck = await salary.getSalaryMonthYear(parseInt(payroll.pym_month), parseInt(payroll.pym_year)).then((data)=>{
        return data
      });

      if(!(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck))){
        return res.status(400).json(`Payroll Routine has already been run`)
      }

        const existingRecord = await variationalPayment.getVariationalPaymentMonthYear(parseInt(payroll.pym_month), parseInt(payroll.pym_year),requestBody.employee).then((r)=>{
            return r;
        });
        if(existingRecord){
            return res.status(400).json("There's an existing record in variational payment");
        }
        const payment = {
          vp_emp_id: parseInt(requestBody.employee),
          vp_payment_def_id: parseInt(requestBody.default_id),
          vp_amount: requestBody.amount,
          vp_payment_month: parseInt(payroll.pym_month), //parseInt(requestBody.month),
          vp_payment_year: parseInt(payroll.pym_year), //parseInt(requestBody.year)
          vp_default_id: parseInt(requestBody.default_id),
        }

        const val = await variationalPayment.setNewSingleVariationalPayment(payment).then((data)=>{
            return data; //res.status(200).json("Action successful.");
        });

      const upTsp = await timesheetPenaltyService.updateTimeSheetPenaltyMonthYearEmpIdStatus(parseInt(requestBody.employee), parseInt(payroll.pym_month), parseInt(payroll.pym_year), 1).then((res)=>{
        return res;
      });
      res.status(200).json("Action successful.");
    }catch (e) {
        return res.status(400).json("Something went wrong.");
    }
});

router.get('/:id', auth, async (req, res, next)=>{
    try{
        const id = req.params.id;
        variationalPayment.getVariationalPaymentById(id).then((data)=>{
            return res.status(200).json(data);
        })
    }catch (e) {
        return res.status(400).json('Something went wrong. Try again.');
    }
});

router.post('/confirm-payment', auth, async (req, res, next)=>{
    try{
        const schema = Joi.object({
            status: Joi.number().required(),
           variational_payment: Joi.array().items(Joi.number().required()),
        });
        const vpRequest = req.body
        const validationResult = schema.validate(vpRequest)
        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        let payments = req.body.variational_payment
        let status = req.body.status
        for (const payment of payments) {
            const vp = await variationalPayment.getVariationalPaymentById(payment).then((data)=>{
                return data;
            });
            if(!(_.isNull(vp) || _.isEmpty(vp))){
                const userId = req.user.username.user_id
                await variationalPayment.updateVariationalPaymentStatus(payment, status, userId).then()
            }
        }
        return res.status(200).json('Action Successful');
    }catch (e) {
        return res.status(400).json('Something went wrong. Try again.'+e.message);
    }
});

router.get('/current-payment/:year/:month', auth, async (req, res, next)=>{
    try{
        let month = req.params.month
        let year = req.params.year
        await variationalPayment.getCurrentPayment(year, month).then((data)=>{
            return res.status(200).json(data);
        })
    }catch (e) {
        return res.status(400).json(`Something went wrong. Try again. ${e.message}`);
    }
});

router.get('/current-pending-payment/:year/:month', auth, async (req, res, next)=>{
    try{
        let month = req.params.month
        let year = req.params.year
        await variationalPayment.getCurrentPendingPayment(year, month).then((data)=>{
            return res.status(200).json(data);
        })
    }catch (e) {
        return res.status(400).json(`Something went wrong. Try again. ${e.message}`);
    }
});

router.patch('/update-payment-amount/:id', auth, async (req, res, next)=>{
    try{
        const schema = Joi.object({
            vp_amount: Joi.number().required(),

        });
        const vpRequest = req.body
        const validationResult = schema.validate(vpRequest)
        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const vpId = req.params.id


        const payments = await variationalPayment.findPayment(vpId).then((data)=>{
            return data
        })

        if(_.isEmpty(payments) || _.isNull(payments)){
            return res.status(400).json('Payment does not exists');
        }


        const updateResponse = await variationalPayment.updateAmount(vpId, vpRequest.vp_amount).then((data)=>{
            return data
        })

        if(_.isEmpty(updateResponse) || _.isNull(updateResponse)){
            return res.status(400).json('An error occurred');
        }

        return res.status(200).json('Action Successful');

    }catch (e) {
        return res.status(400).json('Something went wrong. Try again.'+e.message);
    }
});


router.get('/unconfirmed-payment', auth, async (req, res, next)=>{
    try{
        await variationalPayment.getUnconfirmedVariationalPayment().then((data)=>{
            return res.status(200).json(data);
        })
    }catch (e) {
        return res.status(400).json('Something went wrong. Try again.');
    }
});



module.exports = router;
