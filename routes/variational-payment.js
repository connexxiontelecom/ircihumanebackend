const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const variationalPayment =  require('../services/variationalPaymentService');
const paymentDefinition =  require('../services/paymentDefinitionService');
const payrollMonthYear =  require('../services/payrollMonthYearService');
const employees = require('../services/employeeService');
const logs = require('../services/logService')


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
        const schema = Joi.object({
            employee: Joi.array().items(Joi.number().required()),
            payment_definition:Joi.number().required(),
            amount:Joi.number().required(),
            month:Joi.number().required(),
            year:Joi.number().required()
        });

        const vpRequest = req.body
        const validationResult = schema.validate(vpRequest)
        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const payrollR = 0;
        if(payrollR === 1){
            return res.status(400).json("You cannot run payroll routine for this period");
        }else{
            const pdId = await paymentDefinition.findPaymentById(req.body.payment_definition).then((data)=>{
                return  data;
            });

            if(parseInt(pdId.pd_payment_variant) !== 1) return res.status(400).json('Choose variational payment from the option provided.');

            let employeesIds = req.body.employee
            for (const emp of employeesIds) {
                const employeeData =  await employees.getEmployee(emp).then((data)=>{
                    return data
                })
                if(!(_.isNull(employeeData) || _.isEmpty(employeeData))){

                    const checkExisting = await variationalPayment.checkDuplicateEntry(parseInt(emp), parseInt(req.body.year), parseInt(req.body.month), parseInt(req.body.payment_definition)).then((data)=>{
                        return data
                    })

                    if(!(_.isNull(checkExisting) || _.isEmpty(checkExisting))){


                    }

                  const vpObject = {
                      vp_emp_id: parseInt(emp),
                      vp_payment_def_id: parseInt(req.body.payment_definition),
                      vp_amount:  parseFloat(req.body.amount),
                      vp_payment_month:  parseInt(req.body.month),
                      vp_payment_year:  parseInt(req.body.year)
                  }
                  await variationalPayment.setNewVariationalPayment(vpObject).then()
               }
            }
            return res.status(200).json('Action Successful')
        }

    }catch (e) {
        return res.status(400).json(`Error while posting variational payment.${e.message}`);
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
