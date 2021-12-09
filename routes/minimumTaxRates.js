const Joi = require('joi')
const _ = require('lodash');
const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const minimumTaxRate =  require('../services/minimumTaxRateService');
const logs = require('../services/logService')


/* Get minimum tax rate */
router.get('/', auth, async function(req, res, next) {
    try {
        await minimumTaxRate.findAllMinimumTaxRate().then((data) =>{
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching Minimum Tax Rate ${err.message}`)
    }
});

/* Add Payment Definition */
router.post('/add-minimum-tax-rate', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            mtr_rate: Joi.number().precision(2).required(),
          })

        const minimumTaxRateRequest = req.body
        const validationResult = schema.validate(minimumTaxRateRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await minimumTaxRate.findAllMinimumTaxRate().then((data) =>{
            if(_.isEmpty(data)){
                minimumTaxRate.addMinimumTaxRate(minimumTaxRateRequest).then((data)=>{
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Added new minimum tax rate",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes)=>{
                        //return res.status(200).json(logRes);
                        return  res.status(200).json(data)
                    })

                })

            }else{
                return  res.status(403).json('Minimum Tax Rate Set Up Already')
            }
        })


    } catch (err) {
        console.error(`Error while adding Minimum tax rate `, err.message);
        next(err);
    }
});

/* Update Payment Definition */
router.patch('/update-minimum-tax-rate/:mtr_id', auth,  async function(req, res, next) {
    try {

        const schema = Joi.object( {
            mtr_rate: Joi.number().precision(2).required(),

        })

        const minimumTaxRateRequest = req.body
        const validationResult = schema.validate(minimumTaxRateRequest)


        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await minimumTaxRate.findMinimumTaxRateById(req.params['mtr_id']).then((data) =>{
            if(_.isEmpty(data)){
                return res.status(404).json(`Minimum Tax Rate doesn't exist`)
            }else{
                minimumTaxRate.updateMinimumTaxRate(minimumTaxRateRequest, req.params['mtr_id']).then((data)=>{
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Updated Tax Rate",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes)=>{
                        //return res.status(200).json(logRes);
                        return  res.status(200).json(`Minimum Tax Rate Updated`)
                    })
                })
            }
        })
    } catch (err) {

        console.error(`Error while updating Minimum Tax Rate `, err.message);
        next(err);
    }
});


module.exports = router;
