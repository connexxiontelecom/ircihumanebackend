const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const _ = require('lodash')
const logs = require('../services/logService')
const employees = require('../services/employeeService');
const auth = require("../middleware/auth");
const Joi = require("joi");


/* GET employees. */
router.get('/', auth, employees.getAllEmployee);
/*router.get('/getemployee', async function(req, res, next){

})*/
router.post('/employee-enrollment',auth, employees.createNewEmployee);

router.post('/set-supervisor', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            emp_supervisor_status: Joi.number().required(),
            emp_id: Joi.number().required()
        })

        const supervisorRequest = req.body
        const validationResult = schema.validate(supervisorRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await employees.setSupervisorStatus(supervisorRequest).then((data) =>{
            if(_.isEmpty(data)){

                return res.status(400).json('An error occurred while updating supervisor status')

            }else{
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Updated Employee Supervisor Status",
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{

                    return  res.status(200).json('Supervisor Status Updated')
                })
            }
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status `, err.message);
        next(err);
    }
});

router.get('/get-supervisor', auth, async function(req, res, next) {
    try {
        await employees.getSupervisors().then((data) =>{
            return  res.status(200).json(data)
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status`, err.message);
        next(err);
    }
});

router.get('/get-none-supervisor', auth, async function(req, res, next) {
    try {
        await employees.getNoneSupervisors().then((data) =>{
            return  res.status(200).json(data)
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status`, err.message);
        next(err);
    }
});

module.exports = router;
