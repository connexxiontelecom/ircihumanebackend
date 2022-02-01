const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const grantChart =  require('../services/grantChartService');
const budgetHolders = require('../services/budgetHolderService');
const logs = require('../services/logService')


/* Get All grant chart */
router.get('/', auth, async function(req, res, next) {
    try {
        await grantChart.findAllCodes().then((data) =>{
            return res.status(200).json(data);
               })
    } catch (err) {
        return res.status(400).json(`Error while fetching grant Chart ${err.message}`)
    }
});

/* Add grant chart */
router.post('/add-grant-chart', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            gc_location_id: Joi.number().required(),
            gc_department_id: Joi.number().required(),
            gc_expense: Joi.string().required(),
            gc_account_code: Joi.string().required(),
            gc_description: Joi.string().required(),
            gc_amount: Joi.number().precision(2).required(),
            gc_donor_id: Joi.number().required()
     })

        const gcRequest = req.body
        const validationResult = schema.validate(gcRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await grantChart.findGrantChartByCode(gcRequest.gc_account_code).then((data) =>{
            if(data){

                return res.status(400).json('Grant Chart Code Already Exist')

            }else{
               grantChart.addGrantChart(gcRequest).then((data)=>{

                   let granChart = data.gc_id

                   //budgetHolders.forEach((budgetHolder)=>{
                    budgetHolders.setNewBudgetHolder(req.user.username.user_id, grantChart)
                   //});
                   const logData = {
                       "log_user_id": req.user.username.user_id,
                       "log_description": "Added new Grant Chart Component",
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
        console.error(`Error while adding Grant Chart Component `, err.message);
        next(err);
    }
});

/* Update Payment Definition */
router.patch('/update-grant-chart/:gc_id', auth,  async function(req, res, next) {
    try {

        const schema = Joi.object( {

            gc_location_id: Joi.number().required(),
            gc_department_id: Joi.number().required(),
            gc_expense: Joi.string().required(),
            gc_account_code: Joi.string().required(),
            gc_description: Joi.string().required(),
            gc_amount: Joi.number().precision(2).required(),
            gc_donor_id: Joi.number().required()
        })

        const gcRequest = req.body
        const validationResult = schema.validate(gcRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await grantChart.findGrantChartById(req.params['gc_id']).then((data) =>{
            if(data){
                grantChart.findGrantChartByCode(gcRequest.gc_account_code).then((data)=>{
                    if(data){
                        if(parseInt(data.gc_id) === parseInt(req.params['gc_id'])){
                            grantChart.updateGrantChart(gcRequest, req.params['gc_id']).then((data)=>{
                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Updated Grant Chart Component",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes)=>{
                                    //return res.status(200).json(logRes);
                                    return  res.status(200).json(`Grant Chart Component Updated`)
                                })

                            })
                        }else{
                            return res.status(400).json('Grant Chart Account code already exist')
                        }
                    }else{
                        grantChart.updateGrantChart(gcRequest, req.params['gc_id']).then((data)=>{
                            const logData = {
                                "log_user_id": req.user.username.user_id,
                                "log_description": "Updated Grant Chart Component",
                                "log_date": new Date()
                            }
                            logs.addLog(logData).then((logRes)=>{
                                //return res.status(200).json(logRes);
                                return  res.status(200).json(`Grant Chart Component Updated`)
                            })

                        })
                    }
                })
            }else{
                return res.status(404).json(`Grant Chart Component doesn't exist`)
            }
        })
    } catch (err) {

        console.error(`Error while updating Grant Chart Component `, err.message);
        next(err);
    }
});

router.get('/grant/donor/:donor_id', auth, async (req, res)=>{
    try{
        const { donor_id } = req.params.donor_id;
        const gc = grantChart.findGrantChartByDonorId(donor_id).then((data)=>{
            return data;
        })
        return res.status(200).json({gc});
    }catch (e) {
        return res.status(400).json({message: "Something went wrong. Try again."});
    }
});


module.exports = router;
