const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const logs = require('../services/logService')
const endYearRating = require('../services/endYearRatingService');

/* Add Self Assessment */
router.post('/add-rating', auth,  async function(req, res, next) {
    try {

        const schema = Joi.object( {
            eyr_empid: Joi.number().required(),
            eyr_year: Joi.string().required(),
            eyr_rating: Joi.number().required(),
            eyr_by: Joi.number().required(),
        })

        const ratingRequest = req.body
        const validationResult = schema.validate(ratingRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await endYearRating.addRating(ratingRequest).then((data)=>{
            if(!(_.isNull(data) || _.isEmpty(data))){
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Responded to Goal Setting",
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{

                    return  res.status(200).json(`Action Successful`)
                })
            }else{
                return  res.status(400).json(`An Error Occurred `)
            }
        })
       } catch (err) {
        console.error(`Error while Responding to Goals `, err.message);
        next(err);
    }
});


router.get('/get-rating/:emp_id/:year', auth,  async function(req, res, next) {
    try {


        let empId = req.params.emp_id
        let year = req.params.year



        await endYearRating.findEmployeeRating(empId, year).then((data)=>{
            return  res.status(200).json(data)
        })
    } catch (err) {
        console.error(`Error while fethcing results `, err.message);
        next(err);
    }
});




module.exports = router;
