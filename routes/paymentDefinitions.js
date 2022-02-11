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


router.get('/variational-payments', auth, async function(req, res, next) {
    try {
         await paymentDefinition.getVariationalPayments().then((data) =>{
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching variational payment definition ${err.message}`)
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
            pd_pr_gross: Joi.number().precision(2),
            pd_value:Joi.number(),
            pd_amount: Joi.number(),
            pd_percentage: Joi.number().precision(2),
            pd_tax: Joi.number()
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

                if(parseInt(paymentDefinitionRequest.pd_tax) === 1){
                    const salaryTaxSetup = await paymentDefinition.findTax().then((data)=>{
                        return data
                    })
                    if(!(_.isEmpty(salaryTaxSetup) || _.isNull(salaryTaxSetup))){
                        return res.status(400).json(`Tax Payment Definition Already Set`)
                    }else{
                        paymentDefinitionRequest.pd_pr_gross = 0
                        paymentDefinitionRequest.pd_value = 0
                        paymentDefinitionRequest.pd_payment_type = 0
                    }
                }

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
            pd_desc: Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_basic: Joi.number().required(),
            pd_tie_number: Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_pr_gross: Joi.number().precision(2).required(),
            pd_value:Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_amount: Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_percentage: Joi.alternatives().try(Joi.string(), Joi.number()),
            pd_tax: Joi.number().required()
        })
        let updateResponse
        const paymentDefinitionRequest = req.body

        const validationResult = schema.validate(paymentDefinitionRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const paymentDefinitionDetails = await paymentDefinition.findPaymentById(req.params['pd_id']).then((data) =>{
        return data
        })
            if(_.isNull(paymentDefinitionDetails) || _.isEmpty(paymentDefinitionDetails)){
                         return res.status(404).json(`Payment Definition doesn't exist`)

            }
            else{

                if(parseInt(paymentDefinitionRequest.pd_tax) === 1){
                    const salaryTaxSetup = await paymentDefinition.findTax().then((data)=>{
                        return data
                    })
                    if(!(_.isEmpty(salaryTaxSetup) || _.isNull(salaryTaxSetup))){

                        if(parseInt(salaryTaxSetup.pd_id) !== parseInt(req.params['pd_id'])){
                            return res.status(400).json(`Tax Payment Definition Already Set`)
                        }

                    }else{
                        paymentDefinitionRequest.pd_pr_gross = 0
                        paymentDefinitionRequest.pd_value = 0
                        paymentDefinitionRequest.pd_payment_type = 0
                    }
                }

                const checkGross = await checkForMaxPercentage(paymentDefinitionRequest.pd_pr_gross, paymentDefinitionDetails)

                if(checkGross){
                    if(parseInt(paymentDefinitionRequest.pd_basic) === 1){

                        const basicSalary = await paymentDefinition.findBasicPaymentDefinition().then((data)=>{
                            return data
                        })

                        if(_.isNull(basicSalary) || _.isEmpty(basicSalary)){

                            updateResponse = await updatePaymentDefinition(paymentDefinitionRequest, req.params['pd_id'])
                            if(updateResponse){
                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Updated payment definition",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes)=>{
                                    return res.status(200).json(`Action Successful`)
                                })
                            }else{
                                return res.status(400).json(`Payment Code Already Exists 1`)
                            }


                        }
                        else{
                            if(parseInt(basicSalary.pd_id) === parseInt(req.params['pd_id'])){

                                updateResponse = await updatePaymentDefinition(paymentDefinitionRequest, req.params['pd_id'])
                               if(updateResponse){
                                   const logData = {
                                       "log_user_id": req.user.username.user_id,
                                       "log_description": "Updated payment definition",
                                       "log_date": new Date()
                                   }
                                   logs.addLog(logData).then((logRes)=>{
                                       return res.status(200).json(`Action Successful`)
                                   })
                                }else{
                                    return res.status(400).json(`Payment Code Already Exists 2`)
                                }

                            }
                            else{
                                return res.status(400).json(`Basic Salary Already Exist 3`)

                            }

                        }


                    }
                    else{

                        updateResponse = await updatePaymentDefinition(paymentDefinitionRequest, req.params['pd_id'])
                        if(updateResponse){
                            const logData = {
                                "log_user_id": req.user.username.user_id,
                                "log_description": "Updated payment definition",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes)=>{
                                return res.status(200).json(`Action Successful`)
                            })

                        }else{
                            return res.status(400).json(`Payment Code Already Exists 4`)
                        }

                    }
                }else{
                    return res.status(400).json(`Percentage Gross is exceeding 100%`)
                }

            }

    } catch (err) {

        console.error(`Error while updating payment definitions `, err.message);
        next(err);
    }
});


async function updatePaymentDefinition(paymentDefinitionRequest, paymentDefinitionId){
    let updateResponse
    const paymentDefinitionByCode = await  paymentDefinition.findPaymentByCode(paymentDefinitionRequest.pd_payment_code).then((data)=>{
        return data
    })
    if(_.isEmpty(paymentDefinitionByCode) || _.isNull(paymentDefinitionByCode)){
       updateResponse =  await paymentDefinition.updatePaymentDefinition(paymentDefinitionRequest, paymentDefinitionId).then((data)=>{
            return data
        })

    }
    else{
          if(parseInt(paymentDefinitionByCode.pd_id) === parseInt(paymentDefinitionId)){

          updateResponse =   await paymentDefinition.updatePaymentDefinition(paymentDefinitionRequest, paymentDefinitionId).then((data)=>{
                return data

            })
        }

    }
    return !(_.isNull(updateResponse) || _.isEmpty(updateResponse));

}

async function checkForMaxPercentage(value, paymentDefinitionDetails){
    let totalPercentageGross = await paymentDefinition.findSumPercentage().then((data) =>{
        return data
    })
    totalPercentageGross = parseFloat(totalPercentageGross)
     value = parseFloat(value)

    let currentPercentageGross = parseFloat(paymentDefinitionDetails.pd_pr_gross)
    return value + (totalPercentageGross - currentPercentageGross) <= 100;
}

module.exports = router;
