const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const _ = require('lodash')
const logs = require('../services/logService')
const employees = require('../services/employeeService');
const auth = require("../middleware/auth");
const Joi = require("joi");
const fs = require('fs');
const AWS = require('aws-sdk');
const multer = require("multer");
const multerS3 = require("multer-s3");
var path = require('path')
const s3 = new AWS.S3({
    accessKeyId: 'AKIATYY72EVXSJWLSFK7',
    secretAccessKey: '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'
});


/* GET employees. */
router.get('/', auth, employees.getAllEmployee);
/*router.get('/getemployee', async function(req, res, next){

})*/

router.get('/get-employee/:emp_id', auth, async function(req, res, next){
    try {
        let empId = req.params['emp_id']
        await employees.getEmployee(empId).then((data)=>{
            if(_.isEmpty(data)){
                return res.status(404).json(`Employee Doesn't Exist`)
            }else{
              return res.status(200).json(data)
            }
        })

    } catch (err) {
        console.error(`An error occurred while fetching Employee `, err.message);
        next(err);
    }
})
router.post('/employee-enrollment',auth, employees.createNewEmployee);

router.patch('/update-employee/:emp_id', auth,  async function(req, res, next) {
    try {
        let empId = req.params['emp_id']
        await employees.getEmployee(empId).then((data)=>{
            if(_.isEmpty(data)){
                return res.status(400).json(`Employee Doesn't Exist`)
            }else{
                const employeeData = req.body
                employees.updateEmployee(empId, employeeData).then((data)=>{
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Updated Employee Details",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes)=>{

                        return  res.status(200).json('Action Successful')
                    })
                })

            }
        })

    } catch (err) {
        console.error(`An error occurred while updating Employee `, err.message);
        next(err);
    }
});


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

router.get('/get-supervisor-employees/:emp_id', auth, async function(req, res, next) {
    try {
        let empId = req.params.emp_id
        const employeeData = await employees.getEmployee(empId).then((data)=>{
            return data
        })

        if(_.isEmpty(employeeData) || _.isNull(employeeData)){
            return res.status(400).json(` Employee Does Not exist`)
        }
        else{
            await employees.getSupervisorEmployee(empId).then((data) =>{
                return  res.status(200).json(data)
            })
        }

    } catch (err) {
        console.error(`An error occurred while fetching`, err.message);
        next(err);
    }
});

router.post('/upload-files', auth,  async function(req, res, next) {
    try {

        const fileRequest = req.files.test
        const fileExt = path.extname(fileRequest.name)
        const timeStamp = new Date().getTime()
        const fileContent  = Buffer.from(req.files.test.data, 'binary');
        const fileName = `${timeStamp}${fileExt}`;
        const uploadFile = () => {
            const params = {
                Bucket: 'irc-ihumane', // pass your bucket name
                Key: fileName, // file will be saved as testBucket/contacts.csv
                Body: fileContent
            };
            s3.upload(params, function(s3Err, data) {
                if (s3Err) {
                    return  res.status(400).json(s3Err)
                }

                return  res.status(200).json(`File uploaded successfully at ${data.Location}`)
                // console.log(`File uploaded successfully at ${data.Location}`)
            });



        };

        uploadFile();
    } catch (err) {
        console.error(`An error occurred while updating supervisor status `, err.message);
        next(err);
    }
});


module.exports = router;
