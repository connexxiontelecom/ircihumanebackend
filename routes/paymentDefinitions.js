const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const paymentDefinition =  require('../services/paymentDefinitionService');
const logs = require('../services/logService')
const _ = require('lodash')


/* Get All Payment Definitions */
router.get('/', auth, async function(req, res, next) {
    try {

       // return res.status(200).json(req.user.username);

        await paymentDefinition.findAllCodes().then((data) =>{
            return res.status(200).json(data);
               })
    } catch (err) {
        return res.status(400).json(`Error while fetching payment definition ${err.message}`)
    }
});

/* Add Payment Definition */
router.post('/add-payment-definition', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            pd_payment_code: Joi.string().required(),
            pd_payment_name: Joi.string().required(),
            pd_payment_type: Joi.number().required(),
            pd_payment_variant: Joi.number().required(),
            pd_payment_taxable: Joi.number().required(),
            pd_desc: Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_basic: Joi.number().required(),
            pd_tie_number: Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_pr_gross: Joi.number().precision(2)
        })

        const paymentDefinitionRequest = req.body
        const validationResult = schema.validate(paymentDefinitionRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) =>{
            return data
        })
            totalPercentageGross = parseFloat(totalPercentageGross)
        if(totalPercentageGross <= 100){
            let remaining = 100 - totalPercentageGross;

            if(parseFloat(paymentDefinitionRequest.pd_pr_gross) > remaining){
                return res.status(400).json(`Percentage Gross is exceeding 100%`)
            }

            else{

                if(parseInt(paymentDefinitionRequest.pd_basic) === 1){
                 const basicSalary = await paymentDefinition.findBasicPaymentDefinition().then((data)=>{
                     return data
                 })

                    if(_.isEmpty(basicSalary) || _.isNull(basicSalary)){
                        await paymentDefinition.findPaymentByCode(paymentDefinitionRequest.pd_payment_code).then((data) =>{
                            if(data){

                                return res.status(400).json('Payment Code Already Exist')

                            }else{
                                paymentDefinition.addPaymentDefinition(paymentDefinitionRequest).then((data)=>{
                                    const logData = {
                                        "log_user_id": req.user.username.user_id,
                                        "log_description": "Added new payment definition",
                                        "log_date": new Date()
                                    }
                                    logs.addLog(logData).then((logRes)=>{
                                        //return res.status(200).json(logRes);
                                        return  res.status(200).json(data)
                                    })

                                })
                            }
                        })

                    }else{
                        return res.status(400).json(`Basic Salary Already Set`)
                    }

                }else{

                    await paymentDefinition.findPaymentByCode(paymentDefinitionRequest.pd_payment_code).then((data) =>{
                        if(data){

                            return res.status(400).json('Payment Code Already Exist')

                        }else{
                            paymentDefinition.addPaymentDefinition(paymentDefinitionRequest).then((data)=>{
                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Added new payment definition",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes)=>{
                                    //return res.status(200).json(logRes);
                                    return  res.status(200).json(data)
                                })

                            })
                        }
                    })
                }



            }

        }





            } catch (err) {
        console.error(`Error while adding payment definition `, err.message);
        next(err);
    }
});

/* Update Payment Definition */
router.patch('/update-payment-definition/:pd_id', auth,  async function(req, res, next) {
    try {

        const schema = Joi.object( {
            pd_payment_code: Joi.string().required(),
            pd_payment_name: Joi.string().required(),
            pd_payment_type: Joi.number().required(),
            pd_payment_variant: Joi.number().required(),
            pd_payment_taxable: Joi.number().required(),
            pd_desc: Joi.number(),
            pd_basic: Joi.number().required(),
            pd_tie_number: Joi.string()
        })

        const paymentDefinitionRequest = req.body

        const validationResult = schema.validate(paymentDefinitionRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await paymentDefinition.findPaymentById(req.params['pd_id']).then((data) =>{
            if(data){


                paymentDefinition.findPaymentByCode(paymentDefinitionRequest.pd_payment_code).then((data)=>{
                    if(data){
                        if(data.pd_id === parseInt(req.params['pd_id'])){
                            paymentDefinition.updatePaymentDefinition(paymentDefinitionRequest, req.params['pd_id']).then((data)=>{
                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Updated payment definition",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes)=>{
                                    //return res.status(200).json(logRes);
                                    return  res.status(200).json(`Payment Definition Updated`)
                                })

                            })
                        }else{
                            return res.status(400).json('payment code already exist')
                        }
                    }else{
                        paymentDefinition.updatePaymentDefinition(paymentDefinitionRequest, req.params['pd_id']).then((data)=>{
                            return res.status(200).json(`Payment Definition Updated`)
                        })
                    }
                })



            }else{
                return res.status(404).json(`Payment Definition doesn't exist`)
            }
        })
    } catch (err) {

        console.error(`Error while updating payment definitions `, err.message);
        next(err);
    }
});


module.exports = router;
