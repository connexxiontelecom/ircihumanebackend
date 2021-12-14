const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const donor =  require('../services/donorService');
const logs = require('../services/logService')


/* Get All donors */
router.get('/', auth, async function(req, res, next) {
    try {

       // return res.status(200).json(req.user.username);

        await donor.findAllDonors().then((data) =>{
            return res.status(200).json(data);
               })
    } catch (err) {
        return res.status(400).json(`Error while fetching donors ${err.message}`)
    }
});

/* Add Donor */
router.post('/add-donor', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            donor_code: Joi.string().required(),
            donor_description: Joi.string().required(),
                    })

        const donorRequest = req.body
        const validationResult = schema.validate(donorRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await donor.findDonorByCode(donorRequest.donor_code).then((data) =>{
            if(data){

                return res.status(400).json('Donor Code Already Exist')

            }else{
               donor.addDonor(donorRequest).then((data)=>{
                   const logData = {
                       "log_user_id": req.user.username.user_id,
                       "log_description": "Added new Donor",
                       "log_date": new Date()
                   }
                   logs.addLog(logData).then((logRes)=>{
                       //return res.status(200).json(logRes);
                       return  res.status(200).json(data)
                   })

                })
            }
        })
    } catch (err) {
        console.error(`Error while adding donor `, err.message);
        next(err);
    }
});

/* Update Payment Definition */
router.patch('/update-donor/:donor_id', auth,  async function(req, res, next) {
    try {

        const schema = Joi.object( {
            donor_code: Joi.string().required(),
            donor_description: Joi.string().required(),
        })

        const donorRequest = req.body
        const validationResult = schema.validate(donorRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await donor.findDonorById(req.params['donor_id']).then((data) =>{
            if(data){
                donor.findDonorByCode(donorRequest.donor_code).then((data)=>{
                    if(data){
                        if(parseInt(data.donor_id) === parseInt(req.params['donor_id'])){
                            donor.updateDonor(donorRequest, req.params['donor_id']).then((data)=>{
                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Updated Donor",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes)=>{
                                    //return res.status(200).json(logRes);
                                    return  res.status(200).json(`Donor Updated`)
                                })

                            })
                        }else{
                            return res.status(400).json('Donor code already exist')
                        }
                    }else{
                        donor.updateDonor(donorRequest, req.params['donor_id']).then((data)=>{
                            const logData = {
                                "log_user_id": req.user.username.user_id,
                                "log_description": "Updated Donor",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes)=>{
                                //return res.status(200).json(logRes);
                                return  res.status(200).json(`Payment Definition Updated`)
                            })

                        })
                    }
                })
            }else{
                return res.status(404).json(`Donor doesn't exist`)
            }
        })
    } catch (err) {

        console.error(`Error while updating donor `, err.message);
        next(err);
    }
});


module.exports = router;
