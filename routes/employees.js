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
const dotenv = require('dotenv');
var path = require('path')
const s3 = new AWS.S3({
    accessKeyId: `${process.env.ACCESS_KEY}`,
    secretAccessKey: `${process.env.SECRET_KEY}`
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


router.patch('/upload-profile-pic/:empId', auth,  async function(req, res, next) {
    try {
        let empId = req.params['empId']
       const employeeDatum =  await employees.getEmployee(empId).then((data)=>{
          return data
        })

        if(_.isEmpty(employeeDatum)){
            return res.status(400).json(`Employee Doesn't Exist`)
        }

            const uploadResonse =  await uploadFile(req.files.profilepic).then((response) => {
                return response
            }).catch(err => {
                return res.status(400).json(err)
            })

            const employeeData = {
                emp_passport: uploadResonse
            }
        //return res.status(400).json(employeeData)
       let employeeUpdateResponse = await employees.updateProfilePicture(empId, employeeData).then((data)=>{
               return data
            })

        if(_.isEmpty(employeeUpdateResponse)){
            return res.status(400).json('An error occurred, please try again')
        }

        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Updated Employee Profile",
            "log_date": new Date()
        }
        await logs.addLog(logData).then((logRes)=>{

            return  res.status(200).json('Action Successful')
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
    try{
        // return res.status(200).json({
        //     accessKeyId: 'AKIATYY72EVXSJWLSFK7',
        //     secretAccessKey: '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'
        // })
       let uploadResonse =  await uploadFile(req.files.test).then((response) => {
            return response
        }).catch(err => {
            return res.status(400).json(err)
        })
        return res.status(200).json(uploadResonse)
    } catch (err) {
        console.error(`An error occurred while updating supervisor status `, err.message);
        next(err);
    }
});

const uploadFile = (fileRequest) => {//const fileRequest = req.files.test
    return new Promise(async (resolve, reject) => {
        let s3Res;
        const fileExt = path.extname(fileRequest.name)
        const timeStamp = new Date().getTime()
        const fileContent  = Buffer.from(fileRequest.data, 'binary');
        const fileName = `${timeStamp}${fileExt}`;
        const params = {
            Bucket: 'irc-ihumane', // pass your bucket name
            Key: fileName, // file will be saved as testBucket/contacts.csv
            Body: fileContent
        };
        await s3.upload(params, function(s3Err, data) {
            if (s3Err) {
                reject(s3Err)
            }
            s3Res = data.Location
            resolve(s3Res)
        });
    })

}

module.exports = router;
