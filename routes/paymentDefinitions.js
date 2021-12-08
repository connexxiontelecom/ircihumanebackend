const Joi = require('joi')
const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const paymentDefinition =  require('../services/paymentDefinitionService');



/* Add User */
router.post('/add-payment-definition', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            pd_payment_code: Joi.string().required(),
            pd_payment_name: Joi.string().required(),
            pd_payment_type: Joi.number().required(),
            pd_payment_variant: Joi.number().required(),
            pd_payment_taxable: Joi.number().required(),
            pd_desc: Joi.number(),
            pd_basic: Joi.number().required(),
            pd_tie_number: Joi.string(),
        })

        const paymentDefinitionRequest = req.body
        const validationResult = schema.validate(paymentDefinitionRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await paymentDefinition.findPaymentByCode(paymentDefinitionRequest.pd_payment_code).then((data) =>{
            if(data){

                return res.status(400).json('Payment Code Already Exist')

            }else{
               paymentDefinition.addPaymentDefinition(paymentDefinitionRequest).then((data)=>{

                    return  res.status(200).json(data)
                })
            }
        })
    } catch (err) {
        console.error(`Error while adding payment definition `, err.message);
        next(err);
    }
});

/* UpdateUser */
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
                                return res.status(200).json(`Payment updated ${data}`)
                            })
                        }else{
                            return res.status(400).json('payment code already exist')
                        }
                    }else{
                        paymentDefinition.updatePaymentDefinition(paymentDefinitionRequest, req.params['pd_id']).then((data)=>{
                            return res.status(200).json(`Payment updated ${data}`)
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

/* Login User */
router.get('/', auth, async function(req, res, next) {
    try {

        await paymentDefinition.findAllCodes().then((data) =>{
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while fetching payment definition ${err.message}`)
    }
});




module.exports = router;
