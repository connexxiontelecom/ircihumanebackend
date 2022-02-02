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
        await variationalPayment.getVariationalPayments.then((data) =>{
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching variational payments ${err.message}`)
    }
});

router.post('/', auth, async (req, res)=>{
    try{
        const schema = Joi.object({
            employee: Joi.number().required(),
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
        const pdId = paymentDefinition.findPaymentById(req.body.payment_definition).then((data)=>{
            return data;
        });
        if(pdId.pd_payment_type !== 1) return res.status(400).json({message: 'Choose variational payment from the option provided.'});
        //check payroll routine for month and year
        const period = payrollMonthYear.findPayrollByMonthYear(req.body.month, req.body.year).then((val)=>{
            return val
        });
        if(_.isEmpty(period) || _.isNull(period)){

        }else{

        }
    }catch (e) {
        return res.status(400).json(`Error while posting variational payment`);
    }
});

router.get('/:id', auth, async (req, res)=>{
    try{
        variationalPayment.getVariationalPaymentById(id).then((data)=>{
            return res.status(200).json(data);
        })
    }catch (e) {
        return res.status(200).json({message:'Something went wrong. Try again.'});
    }
});

router.post('/update-status/:id', auth, async (req, res)=>{
    try{
        const schema = Joi.object({
            status: Joi.number().required(),
            vp_id:Joi.number().required()
        });

        const vpRequest = req.body
        const validationResult = schema.validate(vpRequest)

        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        const userId = req.body.user_username.user_id;
        variationalPayment.updateVariationalPaymentStatus(req.body.vp_id, req.body.status, userId).then((data)=>{
            return res.status(200).json(data);
        })
    }catch (e) {
        return res.status(200).json({message:'Something went wrong. Try again.'});
    }
});





module.exports = router;
