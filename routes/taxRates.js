const Joi = require('joi')
const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const taxRate =  require('../services/taxRateService');
const logs = require('../services/logService')


/* Get All Payment Definitions */
router.get('/', auth, async function(req, res, next) {
    try {

        // return res.status(200).json(req.user.username);

        await taxRate.findAllTaxRate().then((data) =>{
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Error while fetching Tax Rates ${err.message}`)
    }
});

/* Add Payment Definition */
router.post('/add-tax-rate', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            tr_band: Joi.number().precision(2).required(),
            tr_rate: Joi.number().precision(2).required(),
          })

        const taxRateRequest = req.body
        const validationResult = schema.validate(taxRateRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await  taxRate.addTaxRate(taxRateRequest).then((data)=>{
            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Added new tax rate",
                "log_date": new Date()
            }
            logs.addLog(logData).then((logRes)=>{
                //return res.status(200).json(logRes);
                return  res.status(200).json(data)
            })

        })
    } catch (err) {
        console.error(`Error while adding tax rate `, err.message);
        next(err);
    }
});

/* Update Payment Definition */
router.patch('/update-tax-rate/:tr_id', auth,  async function(req, res, next) {
    try {

        const schema = Joi.object( {
            tr_band: Joi.number().precision(2).required(),
            tr_rate: Joi.number().precision(2).required(),
        })

        const taxRateRequest = req.body
        const validationResult = schema.validate(taxRateRequest)


        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await taxRate.findTaxRateById(req.params['tr_id']).then((data) =>{
            if(data){
                taxRate.updateTaxRate(taxRateRequest, req.params['tr_id']).then((data)=>{
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Updated Tax Rate",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes)=>{
                        //return res.status(200).json(logRes);
                        return  res.status(200).json(`Tax Rate Updated`)
                    })
                })
            }else{
                return res.status(404).json(`Tax Rate doesn't exist`)
            }
        })
    } catch (err) {

        console.error(`Error while updating Tax Rate `, err.message);
        next(err);
    }
});


module.exports = router;
