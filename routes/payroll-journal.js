const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const users = require('../services/userService');
const logs = require("../services/logService");
const payrollJournalService = require("../services/payrollJournalService");
const locationService = require("../services/locationService")
const payrollMonthYearLocationService = require("../services/payrollMonthYearLocationService");
const salaryMappingDetailsService = require("../services/salaryMappingDetailService");
const salaryMappingMasterService = require("../services/salaryMappingMasterService");
const ROLES = require('../roles')
const _ = require('lodash')
const path = require("path")
const readXlsxFile = require('read-excel-file/node')
const employeeService = require("../services/employeeService");
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    accessKeyId: `${process.env.ACCESS_KEY}`,
    secretAccessKey: `${process.env.SECRET_KEY}`
});
const reader = require('xlsx')
const fs = require('fs')
const https = require("https");


/* Get All Users */
router.get('/', auth(), async function (req, res, next) {
    try {

        await payrollJournalService.getAllPayrollJournal().then((data) => {
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while Payroll Journals ${err.message}`)
    }
});


/* Add User */
router.post('/', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            pj_code: Joi.string().required(),
            pj_journal_item: Joi.string().required(),
            pj_location: Joi.number().required(),
        })
        const validationResult = schema.validate(req.body)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollJournalObject = {
            pj_code: req.body.pj_code,
            pj_journal_item: req.body.pj_journal_item,
            pj_location: req.body.pj_location,
            pj_setup_by: req.user.username.user_id,
        }
        const payrollJournalAddResponse = await payrollJournalService.addPayrollJournal(payrollJournalObject).then((data) => {
            return data
        })

        if (_.isEmpty(payrollJournalAddResponse) || _.isNull(payrollJournalAddResponse)) {
            return res.status(400).json('An Error Occurred While adding Payroll')
        }
        return res.status(200).json('Payroll Journal Added Successfully')
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});

router.patch('/', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            pj_id: Joi.number().required(),
            pj_code: Joi.string().required(),
            pj_journal_item: Joi.string().required(),
            pj_location: Joi.number().required(),
        })
        const validationResult = schema.validate(req.body)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollJournalObject = {
            pj_id: req.body.pj_id,
            pj_code: req.body.pj_code,
            pj_journal_item: req.body.pj_journal_item,
            pj_location: req.body.pj_location,
            pj_setup_by: req.user.username.user_id,
        }

        const checkPayrollJournal = await payrollJournalService.getAllPayrollJournal(payrollJournalObject.pj_id).then((data)=>{
            return data
        })

        if(_.isEmpty(checkPayrollJournal) || _.isNull(checkPayrollJournal)){
            return res.status(400).json('Journal code does not exist')
        }
        const payrollJournalAddResponse = await payrollJournalService.updatePayrollJournal(payrollJournalObject).then((data) => {
            return data
        })

        if (_.isEmpty(payrollJournalAddResponse) || _.isNull(payrollJournalAddResponse)) {
            return res.status(400).json('An Error Occurred While adding Payroll')
        }
        return res.status(200).json('Payroll Journal Updated Successfully')
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});

router.post('/salary-mapping-master', auth(), async function (req, res, next) {
    try {

        const schema = Joi.object({
            smm_month: Joi.number().required(),
            smm_year: Joi.number().required(),
            smm_location: Joi.number().required(),
        })
        const validationResult = schema.validate(req.body)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const locationId = req.body.smm_location

        const locationResponse = await locationService.findLocationById(locationId).then((data)=>{
            return data
        })

        if(_.isEmpty(locationResponse) || _.isNull(locationResponse)){
            return res.status(400).json('Location Does Not Exist')
        }

        const checkSalaryRoutineLocation = await payrollMonthYearLocationService.findApprovedPayrollByMonthYearLocation(req.body.smm_month, req.body.smm_year, locationId ).then((data)=>{
            return data
        })
        if(_.isEmpty(checkSalaryRoutineLocation) || _.isNull(checkSalaryRoutineLocation)){
            return res.status(400).json('Salary routine for location has not been process for selected month and year')
        }
        const refCode = `${req.body.smm_month}-${req.body.smm_year}-${locationResponse.l_t6_code}`

        const smmObject = {
            smm_month: req.body.smm_month,
            smm_year: req.body.smm_year,
            smm_location: req.body.smm_location,
            smm_ref_code: refCode
        }

        const addSalaryMappingMaster = await salaryMappingMasterService.addSalaryMappingMaster(smmObject).then((data)=>{
            return data
        })
        if(_.isEmpty(addSalaryMappingMaster) || _.isNull(addSalaryMappingMaster)){
            return res.status(400).json('An error occurred while adding salary master ')
        }
        // storage.setItem('smm_id', addSalaryMappingMaster.smm_id)
        return res.status(200).json(addSalaryMappingMaster)
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});


router.post('/upload-mapping-detail/:masterId', auth(), async function (req, res, next) {
    try {
        const masterId = req.params['masterId']

        const salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        if(_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)){
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }
        const file = await fs.createWriteStream("file.xlsx")
        let fileExt = path.extname(req.files.salary_map.name)
        fileExt = fileExt.toLowerCase()
        if(fileExt === '.csv' || fileExt === '.xlsx' || fileExt === '.xls'){
            let uploadResponse = await uploadFile(req.files.salary_map).then((response) => {
                return response
            }).catch(err => {
                return res.status(400).json(err)
            })
            uploadResponse = String(uploadResponse)
           await https.get(uploadResponse, async function (response) {
               await response.pipe(file);
           });
            return res.status(200).json('Uploaded Successfully')
        }
        await salaryMappingDetailsService.removeSalaryMappingDetails(masterId)
        await salaryMappingMasterService.removeSalaryMappingMaster(masterId)
        if (fs.existsSync('./file.xlsx')) {
            await fs.unlinkSync('./file.xlsx')
        }
        return res.status(400).json('Invalid file Type')
    } catch (err) {
        const masterId = req.params['masterId']
        await salaryMappingDetailsService.removeSalaryMappingDetails(masterId)
        await salaryMappingMasterService.removeSalaryMappingMaster(masterId)
        if (fs.existsSync('./file.xlsx')) {
            await fs.unlinkSync('./file.xlsx')
        }
        return res.status(400).json(err.message)

    }
});

router.post('/salary-mapping-detail/:masterId', auth(), async function (req, res, next) {
    try {

        const masterId = req.params['masterId']

        const salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        if(_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)){
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }

        if (!fs.existsSync('./file.xlsx')) {
            return res.status(400).json('File has not been uploaded')
        }
        const files = await reader.readFile('./file.xlsx')
        let rows = []
        const sheets = files.SheetNames

        for(let i = 0; i < sheets.length; i++)
        {
            const temp = reader.utils.sheet_to_json(
                files.Sheets[files.SheetNames[i]])
            for (const res1 of temp) {
               rows.push(res1)
            }
        }

        if(_.isEmpty(rows) || _.isNull(rows)){
            return res.status(400).json('File has not been uploaded')
        }

        for(const row of rows){
           let status = 1

            let employeeData = await employeeService.getEmployeeById(row.t7).then((data)=>{
                return data
            })

            if(_.isEmpty(employeeData) || _.isNull(employeeData)){
               status = 0
            }
            let rowObject = {
                smd_master_id: masterId,
                smd_ref_code: salaryMasterData.smm_ref_code,
                smd_employee_t7: row.t7,
                smd_donor_t1: row.t1,
                smd_salary_expense_t2s:row.t2s,
                smd_benefit_expense_t2b: row.t2b,
                smd_allocation: row.allocation,
                smd_status: status,
            }

            let checkDetailResponse = await salaryMappingDetailsService.addSalaryMappingDetail(rowObject).then((data)=>{
                return data
            })
            if(_.isEmpty(checkDetailResponse) || _.isNull(checkDetailResponse)){
                await salaryMappingDetailsService.removeSalaryMappingDetails(masterId)
                await salaryMappingMasterService.removeSalaryMappingMaster(masterId)
                await fs.unlinkSync('./file.xlsx')
                return res.status(400).json('An error occurred while adding details, Please try again')
            }
        }
        await fs.unlinkSync('./file.xlsx')
        return res.status(200).json('Salary mapping uploaded successfully')
    } catch (err) {
        console.error( err.message);
        next(err);
    }
});



const uploadFile = (fileRequest) => {//const fileRequest = req.files.test
    return new Promise(async (resolve, reject) => {
        let s3Res;
        const fileExt = path.extname(fileRequest.name)
        const timeStamp = new Date().getTime()
        const fileContent = Buffer.from(fileRequest.data, 'binary');
        const fileName = `${timeStamp}${fileExt}`;
        const params = {
            Bucket: 'irc-ihumane', // pass your bucket name
            Key: fileName, // file will be saved as testBucket/contacts.csv
            Body: fileContent
        };
        await s3.upload(params, function (s3Err, data) {
            if (s3Err) {
                reject(s3Err)
            }
            s3Res = data.Location
            resolve(s3Res)
        });
    })

}

module.exports = router;
