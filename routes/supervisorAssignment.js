const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const supervisorAssignment =  require('../services/supervisorAssignmentService');
const employees = require('../services/employeeService');
const logs = require('../services/logService')


/* Get All grant chart */
router.get('/', auth, async function(req, res, next) {
    try {
        await supervisorAssignment.findAllAssignments().then((data) =>{
            return res.status(200).json(data);
               })
    } catch (err) {
        return res.status(400).json(`Error while fetching grant Chart ${err.message}`)
    }
});

/* Add grant chart */
router.post('/add-assignment', auth,  async function(req, res, next) {
    try {
        const schema = Joi.object( {
            sa_emp_id: Joi.number().required(),
            sa_supervisor_id: Joi.number().required(),
     })

        const saRequest = req.body
        const validationResult = schema.validate(saRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }

        if(parseInt(saRequest.sa_emp_id) === parseInt(saRequest.sa_supervisor_id) ){
            return res.status(400).json("Employee cannot self supervise themselves")
        }else{
            await supervisorAssignment.findLastActiveAssignment(saRequest.sa_emp_id).then((data) =>{
                if(!_.isEmpty(data)){
                    supervisorAssignment.updateAssignment(data[0].sa_id).then((data)=>{
                        supervisorAssignment.addAssignment(saRequest).then((data)=>{
                            employees.setSupervisor(saRequest.sa_emp_id, saRequest.sa_supervisor_id).then((data)=>{
                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Added Supervisor Assignment",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes)=>{
                                    return  res.status(200).json(data)
                                })
                            })
                        })
                    })
                }else{
                    supervisorAssignment.addAssignment(saRequest).then((data)=>{
                        const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Added Supervisor Assignment",
                            "log_date": new Date()
                        }
                        logs.addLog(logData).then((logRes)=>{
                            return  res.status(200).json(data)
                        })
                    })
                }
            })
        }

    } catch (err) {
        console.error(`Error while assigning supervisor `, err.message);
        next(err);
    }
});


module.exports = router;
