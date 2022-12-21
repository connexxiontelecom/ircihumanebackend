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
const journalService = require("../services/journalService");
const salaryService = require("../services/salaryService");
const jobRoleService = require("../services/jobRoleService")
const sectorService = require("../services/departmentService")
const pensionProviderService = require("../services/pensionProivderService");
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
const paymentDefinitionService = require("../services/paymentDefinitionService");
const salary = require("../services/salaryService");
const paymentDefinition = require("../services/paymentDefinitionService");
const departmentService = require("../services/departmentService");
const mailer = require("../services/IRCMailer");
const timeAllocationService = require("../services/timeAllocationService");



router.get('/', auth(), async function (req, res, next) {
    try {

        await payrollJournalService.getAllPayrollJournal().then((data) => {
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while Payroll Journals ${err.message}`)
    }
});

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

        const checkPayrollJournal = await payrollJournalService.getAllPayrollJournal(payrollJournalObject.pj_id).then((data) => {
            return data
        })

        if (_.isEmpty(checkPayrollJournal) || _.isNull(checkPayrollJournal)) {
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

        const locationResponse = await locationService.findLocationById(locationId).then((data) => {
            return data
        })

        if (_.isEmpty(locationResponse) || _.isNull(locationResponse)) {
            return res.status(400).json('Location Does Not Exist')
        }

        const checkSalaryRoutineLocation = await payrollMonthYearLocationService.findApprovedPayrollByMonthYearLocation(req.body.smm_month, req.body.smm_year, locationId).then((data) => {
            return data
        })
        if (_.isEmpty(checkSalaryRoutineLocation) || _.isNull(checkSalaryRoutineLocation)) {
            return res.status(400).json('Salary routine for location has not been process for selected month and year')
        }
        const refCode = `${req.body.smm_month}-${req.body.smm_year}-${locationResponse.l_t6_code}`

        const checkExistingRefCode = await salaryMappingMasterService.getSalaryMappingMasterByRefCode(refCode).then((data)=>{
            return data
        })

        if(!_.isEmpty(checkExistingRefCode) && !_.isNull(checkExistingRefCode)){
            return res.status(400).json('RefCode already exists')
        }

        const smmObject = {
            smm_month: req.body.smm_month,
            smm_year: req.body.smm_year,
            smm_location: req.body.smm_location,
            smm_ref_code: refCode
        }

        const addSalaryMappingMaster = await salaryMappingMasterService.addSalaryMappingMaster(smmObject).then((data) => {
            return data
        })
        if (_.isEmpty(addSalaryMappingMaster) || _.isNull(addSalaryMappingMaster)) {
            return res.status(400).json('An error occurred while adding salary master ')
        }
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

        if (_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)) {
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }
        const file = await fs.createWriteStream("file.xlsx")
        let fileExt = path.extname(req.files.salary_map.name)
        fileExt = fileExt.toLowerCase()
        if (fileExt === '.csv' || fileExt === '.xlsx' || fileExt === '.xls') {
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

router.get('/salary-mapping-detail/:masterId', auth(), async function (req, res, next) {
    try {

        const masterId = req.params['masterId']

        const salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        const month = salaryMasterData.smm_month.toString(10).padStart(2, '0')

        const year = salaryMasterData.smm_year

        if (_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)) {
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }

        await sleep(60000);

        if (!fs.existsSync('./file.xlsx')) {
            await salaryMappingDetailsService.removeSalaryMappingDetails(masterId)
            await salaryMappingMasterService.removeSalaryMappingMaster(masterId)
            return res.status(400).json('File has not been uploaded')
        }
        const files = await reader.readFile('./file.xlsx')
        let rows = []
        const sheets = files.SheetNames

        for (let i = 0; i < sheets.length; i++) {
            const temp = reader.utils.sheet_to_json(
                files.Sheets[files.SheetNames[i]])
            for (const res1 of temp) {
                rows.push(res1)
            }
        }

        if (_.isEmpty(rows) || _.isNull(rows)) {
            await salaryMappingDetailsService.removeSalaryMappingDetails(masterId)
            await salaryMappingMasterService.removeSalaryMappingMaster(masterId)
            return res.status(400).json('File has not been uploaded')
        }

        for (const row of rows) {
            let status = 1

            let employeeData = await employeeService.getEmployeeById(row.d7).then((data) => {
                return data
            })

            if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
                status = 0
            }

            const findTimeAllocation = await timeAllocationService.findTimeAllocationDetailByStatus(month, year, row.d7);

            if(!_.isEmpty(findTimeAllocation)){
                const refCode = findTimeAllocation.ta_ref_no;
                const approvedBy = findTimeAllocation.ta_approved_by;
                const approvedDate = findTimeAllocation.ta_date_approved;
                const ta_status = findTimeAllocation.ta_status;

            await timeAllocationService.deleteTimeAllocationByRefNo(refCode);

                const timeAllocationObject ={
                    ta_ref_code: refCode,
                    ta_approved_by: approvedBy,
                    ta_status: ta_status,
                    ta_emp_id: row.d7,
                    ta_month: month,
                    ta_year: year,
                    ta_tcode: row.t2s,
                    ta_charge: row.allocation,
                    ta_date_approved: approvedDate,
                    ta_t0_code: null,
                    ta_t0_percent: null
                }

                await timeAllocationService.addTimeAllocation(timeAllocationObject);


            }


            let rowObject = {
                smd_master_id: masterId,
                smd_ref_code: salaryMasterData.smm_ref_code,
                smd_employee_t7: row.d7,
                smd_donor_t1: row.d1,
                smd_salary_expense_t2s: row.t2s,
                smd_benefit_expense_t2b: row.t2b,
                smd_allocation: row.allocation,
                smd_status: status,
            }

            let checkDetailResponse = await salaryMappingDetailsService.addSalaryMappingDetail(rowObject).then((data) => {
                return data
            })
            if (_.isEmpty(checkDetailResponse) || _.isNull(checkDetailResponse)) {
                await salaryMappingDetailsService.removeSalaryMappingDetails(masterId)
                await salaryMappingMasterService.removeSalaryMappingMaster(masterId)
                await fs.unlinkSync('./file.xlsx')
                return res.status(400).json('An error occurred while adding details, Please try again')
            }
        }
        await fs.unlinkSync('./file.xlsx')
        return res.status(200).json('Salary mapping uploaded successfully')
    } catch (err) {
        console.error(err.message);
        next(err);
    }
});

router.get('/salary-mappings', auth(), async function (req, res, next) {
    try {
        const mappingsMaster = await salaryMappingMasterService.getSalaryMappingsMaster().then((data) => {
            return data
        })
        let finalMapping = []
        for (const mapping of mappingsMaster) {

            let locationData = await locationService.findLocationById(mapping.smm_location).then((data) => {
                return data
            })
            let details = await salaryMappingDetailsService.getSalaryMappingDetails(mapping.smm_id).then((data) => {
                return data
            })
            let newMapping = JSON.parse(JSON.stringify(mapping));
            newMapping.smm_total = details.length
            newMapping.location = locationData
            finalMapping.push(newMapping)
        }
        return res.status(200).json(finalMapping)
    } catch (err) {
        return res.status(400).json(err.message)
        // console.error( err.message);
        // next(err);
    }
});

router.get('/get-salary-mapping-detail/:masterId', auth(), async function (req, res, next) {
    try {

        const masterId = req.params['masterId']

        let salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        if (_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)) {
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }

        let details = await salaryMappingDetailsService.getSalaryMappingDetails(masterId).then((data) => {
            return data
        })
        salaryMasterData = JSON.parse(JSON.stringify(salaryMasterData));
        salaryMasterData.smm_total = details.length

        let salaryDetailData = []

        for (const salaryMappingDetail of details) {
            let salaryDetails = await salaryService.getEmployeeSalaryByUniqueId(salaryMasterData.smm_month, salaryMasterData.smm_year, salaryMappingDetail.smd_employee_t7).then((data) => {
                return data
            })

            if(_.isEmpty(salaryDetails) || _.isNull(salaryDetails)){
                salaryDetails = await salaryService.getEmployeeSalaryByD7(salaryMasterData.smm_month, salaryMasterData.smm_year, salaryMappingDetail.smd_employee_t7).then((data) => {
                    return data
                })
            }
            let empName = 'N/A'
            let empJobRole = 'N/A'
            let empLocation = 'N/A'
            let empLocationCode = 'N/A'
            let empSector = 'N/A'
            let empSectorCode = 'N/A'

            if (!_.isEmpty(salaryDetails)) {
                empName = salaryDetails[0].salary_emp_name
                let empJobRoleData = await jobRoleService.findJobRoleById(salaryDetails[0].salary_jobrole_id).then((data) => {
                    return data
                })

                if (!_.isEmpty(empJobRoleData)) {
                    empJobRole = empJobRoleData.job_role
                }

                let empLocationData = await locationService.findLocationById(salaryDetails[0].salary_location_id).then((data) => {
                    return data
                })

                if (!_.isEmpty(empLocationData)) {
                    empLocation = empLocationData.location_name
                    empLocationCode = empLocationData.l_t6_code
                }

                let empSectorData = await sectorService.findDepartmentById(salaryDetails[0].salary_department_id).then((data) => {
                    return data
                })

                if (!_.isEmpty(empSectorData)) {
                    empSector = empSectorData.department_name
                    empSectorCode = empSectorData.d_t3_code
                }
            }

            let newDetail = {}
            newDetail.t7 = salaryMappingDetail.smd_employee_t7
            newDetail.name = empName
            newDetail.t3 = empSectorCode
            newDetail.sector = empSector
            newDetail.t1 = salaryMappingDetail.smd_donor_t1
            newDetail.t2s = salaryMappingDetail.smd_salary_expense_t2s
            newDetail.allocation = salaryMappingDetail.smd_allocation
            newDetail.t2b = salaryMappingDetail.smd_benefit_expense_t2b
            newDetail.jobTitle = empJobRole

            salaryDetailData.push(newDetail)
        }
        const finalMapping = {
            masterData: salaryMasterData,
            detailData: salaryDetailData
        }
        return res.status(200).json(finalMapping)
    } catch (err) {
        return res.status(400).json(err.message)
        // console.error( err.message);
        // next(err);
    }
});

router.get('/process-salary-mapping/:masterId', auth(), async function (req, res, next) {
    try {

        const masterId = req.params['masterId']

        let salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        if (_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)) {
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }

        if(parseInt(salaryMasterData.smm_posted) === 1){
            return res.status(400).json('Salary Mapping Already Posted')
        }

        let details = await salaryMappingDetailsService.getSalaryMappingDetails(masterId).then((data) => {
            return data
        })

        if (_.isEmpty(details) || _.isNull(details)) {
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('Details Does not Exist')
        }
        salaryMasterData = JSON.parse(JSON.stringify(salaryMasterData));
        salaryMasterData.smm_total = details.length

        let mappingLocationData = await locationService.findLocationById(salaryMasterData.smm_location).then((data) => {
            return data
        })

        let empArray = []
        let empIdArray = []
        let journalDetail = {}
        let addJournal

        let lastDayOfMonth = new Date(parseInt(salaryMasterData.smm_year), parseInt(salaryMasterData.smm_month), 0)
        let lastDayOfMonthDD = String(lastDayOfMonth.getDate()).padStart(2, '0');
        let lastDayOfMonthMM = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0'); //January is 0!
        let lastDayOfMonthYYYY = lastDayOfMonth.getFullYear();

        const formatLastDayOfMonth = lastDayOfMonthDD + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthYYYY;

        const grossPayrollCode = await payrollJournalService.getPayrollJournalByJournalItem('GROSS').then((data) => {
            return data
        })

        if(_.isEmpty(grossPayrollCode) || _.isNull(grossPayrollCode)){
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('Gross Payroll Code Does not Exist')
        }

        const netPayrollCode = await payrollJournalService.getPayrollJournalByJournalItem('NET').then((data) => {
            return data
        });
        if(_.isEmpty(netPayrollCode) || _.isNull(netPayrollCode)) {
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('Net Payroll Code Does not Exist')
        }

        const nsitfPayrollCode = await payrollJournalService.getPayrollJournalByJournalItem('NSITF').then((data) => {
            return data
        })

        if(_.isEmpty(nsitfPayrollCode) || _.isNull(nsitfPayrollCode)) {
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('NSITF Payroll Code Does not Exist')
        }

        const nhfPayrollCode = await payrollJournalService.getPayrollJournalByJournalItem('NHF').then((data) => {
            return data
        })

        if(_.isEmpty(nhfPayrollCode) || _.isNull(nhfPayrollCode)) {
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('NHF Payroll Code Does not Exist')
        }

        const payePayrollCode = await payrollJournalService.getPayrollJournalByJournalItemLocation('PAYE', salaryMasterData.smm_location ).then((data) => {
            return data
        })

        if(_.isEmpty(payePayrollCode) || _.isNull(payePayrollCode)) {
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('PAYE Payroll Code Does not Exist')
        }


        for (const salaryMappingDetail of details) {


            let empData =  await employeeService.getEmployeeByD7(salaryMappingDetail.smd_employee_t7).then((data) => {
                return data
            })

            if(_.isEmpty(empData) || _.isNull(empData)) {
                await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data) => {
                    return data
                })
                await  salaryMappingDetailsService.removeSalaryMappingDetails(salaryMappingDetail.smd_id).then((data) => {
                    return data
                })

                await salaryMappingMasterService.removeSalaryMappingMaster(salaryMasterData.smm_id).then((data) => {
                    return data
                })
                return res.status(400).json('One or More Employees Does not Exist')
            }


            let salaryMappingAllocation = await salaryMappingDetailsService.getSalaryMappingDetailsByMasterEmployee(salaryMasterData.smm_id, salaryMappingDetail.smd_employee_t7).then((data) => {
                return data
            })

            let totalAllocation = 0
            for (const allocation of salaryMappingAllocation) {
                totalAllocation += parseFloat(allocation.smd_allocation)
            }

            if(totalAllocation > 100 || totalAllocation < 100) {
                await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data) => {
                    return data
                })
                await  salaryMappingDetailsService.removeSalaryMappingDetails(salaryMappingDetail.smd_id).then((data) => {
                    return data
                })

                await salaryMappingMasterService.removeSalaryMappingMaster(salaryMasterData.smm_id).then((data) => {
                    return data
                })
                return res.status(400).json('Allocation of one or more employee does not equal 100')
            }


            let salaryDetails = await salaryService.getEmployeeSalaryByD7(salaryMasterData.smm_month, salaryMasterData.smm_year, salaryMappingDetail.smd_employee_t7).then((data) => {
                return data
            });

            let empName = 'N/A'
            let empJobRole = 'N/A'
            let empLocation = 'N/A'
            let empLocationCode = 'N/A'
            let empSector = 'N/A'
            let empSectorCode = 'N/A'
            let fullGross = 0;
            let mainDeductions = 0;
            let empAdjustedGross = 0
            let empAdjustedGrossII = 0;
            let employerPension = 0;
            let employerPensionCode = 'N/A';
            let employeeNsitf = 0
            let employeeNHF = 0
            let employeeNsitfCode ='N/A'
            let employeeTax = 0

            if (!_.isEmpty(salaryDetails)) {
                empName = salaryDetails[0].salary_emp_name
                let empJobRoleData = await jobRoleService.findJobRoleById(salaryDetails[0].salary_jobrole_id).then((data) => {
                    return data
                })

                if (!_.isEmpty(empJobRoleData)) {
                    empJobRole = empJobRoleData.job_role
                }

                let empLocationData = await locationService.findLocationById(salaryDetails[0].salary_location_id).then((data) => {
                    return data
                })

                if (!_.isEmpty(empLocationData)) {
                    empLocation = empLocationData.location_name
                    empLocationCode = empLocationData.l_t6_code
                }

                let empSectorData = await sectorService.findDepartmentById(salaryDetails[0].salary_department_id).then((data) => {
                    return data
                })

                if (!_.isEmpty(empSectorData)) {
                    empSector = empSectorData.department_name
                    empSectorCode = empSectorData.d_t3_code
                }

                for (const salary of salaryDetails) {
                    if (parseInt(salary.payment.pd_payment_type) === 1) {

                        if (parseInt(salary.payment.pd_employee) === 1) {
                            fullGross = parseFloat(salary.salary_amount) + fullGross
                        }

                    }else{
                        mainDeductions = parseFloat(salary.salary_amount) + mainDeductions
                    }


                    if (parseInt(salary.payment.pd_total_gross) === 1) {
                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                            empAdjustedGross = empAdjustedGross + parseFloat(salary.salary_amount)
                        }

                        if (parseInt(salary.payment.pd_payment_type) === 2) {
                            empAdjustedGross = empAdjustedGross - parseFloat(salary.salary_amount)
                        }
                    }

                    if (parseInt(salary.payment.pd_total_gross_ii) === 1) {
                        if (parseInt(salary.payment.pd_payment_type) === 1) {
                            empAdjustedGrossII = empAdjustedGrossII + parseFloat(salary.salary_amount)
                        }

                        if (parseInt(salary.payment.pd_payment_type) === 2) {
                            empAdjustedGrossII = empAdjustedGrossII - parseFloat(salary.salary_amount)
                        }
                    }

                    if(parseInt(salary.payment.pd_pension) === 1 && parseInt(salary.payment.pd_employee) === 2 ){
                        employerPension = parseFloat(salary.salary_amount)
                        employerPensionCode = salary.payment.pd_payment_code
                    }

                    if(parseInt(salary.payment.pd_nsitf) === 1  ){
                        employeeNsitf = parseFloat(salary.salary_amount)
                        employeeNsitfCode = salary.payment.pd_payment_code
                    }

                    if(parseInt(salary.payment.pd_nhf) === 1  ){
                        employeeNHF = parseFloat(salary.salary_amount)
                    }

                    if(parseInt(salary.payment.pd_tax) === 1  ){
                        employeeTax = parseFloat(salary.salary_amount)
                    }
                }

                let lastDayOfMonth = new Date(parseInt(salaryMasterData.smm_year), parseInt(salaryMasterData.smm_month), 0)
                let lastDayOfMonthDD = String(lastDayOfMonth.getDate()).padStart(2, '0');
                let lastDayOfMonthMM = String(lastDayOfMonth.getMonth() + 1).padStart(2, '0'); //January is 0!
                let lastDayOfMonthYYYY = lastDayOfMonth.getFullYear();

                const formatLastDayOfMonth = lastDayOfMonthDD + '-' + lastDayOfMonthMM + '-' + lastDayOfMonthYYYY;

                let journalDetail = {}
                let addJournal

                journalDetail.j_acc_code = grossPayrollCode.pj_code
                journalDetail.j_date = formatLastDayOfMonth
                journalDetail.j_ref_code = salaryMappingDetail.smd_ref_code
                journalDetail.j_desc = `${salaryMasterData.smm_month}-sal-${empJobRole}`
                journalDetail.j_d_c = "D"
                journalDetail.j_amount = (parseFloat(salaryMappingDetail.smd_allocation)/100) * empAdjustedGrossII
                journalDetail.j_t1 = salaryMappingDetail.smd_donor_t1
                journalDetail.j_t2 = salaryMappingDetail.smd_salary_expense_t2s
                journalDetail.j_t3 = empSectorCode
                journalDetail.j_t4 = '2NG'
                journalDetail.j_t5 = '2NGA'
                journalDetail.j_month = salaryMasterData.smm_month
                journalDetail.j_year = salaryMasterData.smm_year
                journalDetail.j_t6 = empLocationCode
                journalDetail.j_t7 = salaryMappingDetail.smd_employee_t7
                journalDetail.j_name = empName

                addJournal = await journalService.addJournal(journalDetail).then((data)=>{
                    return data
                })

                if(_.isEmpty(addJournal) || _.isNull(addJournal)){
                    await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                        return data
                    })

                    return res.status(400).json('An error occurred while creating journal entry')
                }

                journalDetail = {}
                journalDetail.j_acc_code = employerPensionCode
                journalDetail.j_date = formatLastDayOfMonth
                journalDetail.j_ref_code = salaryMappingDetail.smd_ref_code
                journalDetail.j_desc = `${salaryMasterData.smm_month}-pen-${empJobRole}`
                journalDetail.j_d_c = "D"
                journalDetail.j_amount = (parseFloat(salaryMappingDetail.smd_allocation)/100) * employerPension
                journalDetail.j_t1 = salaryMappingDetail.smd_donor_t1
                journalDetail.j_t2 = salaryMappingDetail.smd_benefit_expense_t2b
                journalDetail.j_t3 = empSectorCode
                journalDetail.j_t4 = '2NG'
                journalDetail.j_t5 = '2NGA'
                journalDetail.j_month = salaryMasterData.smm_month
                journalDetail.j_year = salaryMasterData.smm_year
                journalDetail.j_t6 = empLocationCode
                journalDetail.j_t7 = salaryMappingDetail.smd_employee_t7
                journalDetail.j_name = empName

                addJournal = await journalService.addJournal(journalDetail).then((data)=>{
                    return data
                })

                if(_.isEmpty(addJournal) || _.isNull(addJournal)){
                    await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                        return data
                    })

                    return res.status(400).json('An error occurred while creating journal entry')
                }

                journalDetail = {}
                journalDetail.j_acc_code = employeeNsitfCode
                journalDetail.j_date = formatLastDayOfMonth
                journalDetail.j_ref_code = salaryMappingDetail.smd_ref_code
                journalDetail.j_desc = `${salaryMasterData.smm_month}-nsitf-${empJobRole}`
                journalDetail.j_d_c = "D"
                journalDetail.j_amount = (parseFloat(salaryMappingDetail.smd_allocation)/100) * employeeNsitf
                journalDetail.j_t1 = salaryMappingDetail.smd_donor_t1
                journalDetail.j_t2 = salaryMappingDetail.smd_benefit_expense_t2b
                journalDetail.j_t3 = empSectorCode
                journalDetail.j_t4 = '2NG'
                journalDetail.j_t5 = '2NGA'
                journalDetail.j_month = salaryMasterData.smm_month
                journalDetail.j_year = salaryMasterData.smm_year
                journalDetail.j_t6 = empLocationCode
                journalDetail.j_t7 = salaryMappingDetail.smd_employee_t7
                journalDetail.j_name = empName

                addJournal = await journalService.addJournal(journalDetail).then((data)=>{
                    return data
                })

                if(_.isEmpty(addJournal) || _.isNull(addJournal)){
                    await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                        return data
                    })

                    return res.status(400).json('An error occurred while creating journal entry')
                }
                let empObject = {
                    employeeD7: salaryMappingDetail.smd_employee_t7,
                    employeeTax: employeeTax,
                    netSalary: fullGross - mainDeductions,
                    employeeNhf: employeeNHF,
                    employeeNsitf: employeeNsitf

                }
                empArray.push(empObject)
            }
        }

        empArray = _.uniqWith(empArray, _.isEqual)
        let totalTax = 0
        let totalNetSalary = 0
        let totalEmployeeNhf = 0
        let totalEmployeeNsitf = 0

        for(const emp of empArray){
            totalTax = totalTax + emp.employeeTax
            totalNetSalary = totalNetSalary + emp.netSalary
            totalEmployeeNhf = totalEmployeeNhf + emp.employeeNhf
            totalEmployeeNsitf  = totalEmployeeNsitf + emp.employeeNsitf
            empIdArray.push(emp.employeeD7)
        }

        const payrollJournalPayments = await paymentDefinitionService.getPayrollJournalPayments().then((data)=>{
          return data
        })
        let paymentName = ''
        for(const payment of payrollJournalPayments){
            let empName = ''
            let empJobRole  = ''
            let empSectorCode = ''
            let empLocationCode = ''
            let empLocation = ''
            let empSector = ''
            paymentName = payment.pd_payment_name
            paymentName = paymentName.replace(/\s+/g, '-').toLowerCase();
            for (const emp of empIdArray){
                let salaryDetails = await salaryService.getEmployeeSalaryByD7AndMonthYear(emp, salaryMasterData.smm_month, salaryMasterData.smm_year, payment.pd_id).then((data) => {
                    return data
                })
                if(!_.isEmpty(salaryDetails) || !_.isNull(salaryDetails)){

                    empName = salaryDetails.salary_emp_name
                    let empJobRoleData = await jobRoleService.findJobRoleById(salaryDetails.salary_jobrole_id).then((data) => {
                        return data
                    })

                    if (!_.isEmpty(empJobRoleData)) {
                        empJobRole = empJobRoleData.job_role
                    }

                    let empLocationData = await locationService.findLocationById(salaryDetails.salary_location_id).then((data) => {
                        return data
                    })

                    if (!_.isEmpty(empLocationData)) {
                        empLocation = empLocationData.location_name
                        empLocationCode = empLocationData.l_t6_code
                    }

                    let empSectorData = await sectorService.findDepartmentById(salaryDetails.salary_department_id).then((data) => {
                        return data
                    })

                    if (!_.isEmpty(empSectorData)) {
                        empSector = empSectorData.department_name
                        empSectorCode = empSectorData.d_t3_code
                    }

                    journalDetail.j_acc_code = payment.pd_payment_code
                    journalDetail.j_date = formatLastDayOfMonth
                    journalDetail.j_ref_code = salaryMasterData.smm_ref_code
                    journalDetail.j_desc = `${salaryMasterData.smm_month}-${paymentName}-${empJobRole}`
                    journalDetail.j_d_c = "C"
                    journalDetail.j_amount = 0 - parseFloat(salaryDetails.salary_amount)
                    journalDetail.j_t1 = null
                    journalDetail.j_t2 = null
                    journalDetail.j_t3 = empSectorCode
                    journalDetail.j_t4 = '2NG'
                    journalDetail.j_t5 = '2NGA'
                    journalDetail.j_month = salaryMasterData.smm_month
                    journalDetail.j_year = salaryMasterData.smm_year
                    journalDetail.j_t6 = empLocationCode
                    journalDetail.j_t7 = emp
                    journalDetail.j_name = empName

                    addJournal = await journalService.addJournal(journalDetail).then((data)=>{
                        return data
                    })

                    if(_.isEmpty(addJournal) || _.isNull(addJournal)){
                        await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                            return data
                        })

                        return res.status(400).json('An error occurred while creating journal entry')
                    }

                }

            }
        }


        journalDetail = {}
        journalDetail.j_acc_code = nsitfPayrollCode.pj_code
        journalDetail.j_date = formatLastDayOfMonth
        journalDetail.j_ref_code = salaryMasterData.smm_ref_code
        journalDetail.j_desc = `${salaryMasterData.smm_month}-NSITF`
        journalDetail.j_d_c = "C"
        journalDetail.j_amount = 0 - totalEmployeeNsitf
        journalDetail.j_t1 = "u1000"
        journalDetail.j_t2 = "Null"
        journalDetail.j_t3 = "Null"
        journalDetail.j_t4 = '2NG'
        journalDetail.j_t5 = '2NGA'
        journalDetail.j_month = salaryMasterData.smm_month
        journalDetail.j_year = salaryMasterData.smm_year
        journalDetail.j_t6 = mappingLocationData.l_t6_code
        journalDetail.j_t7 = "null"
        journalDetail.j_name = "null"

        addJournal =  await journalService.addJournal(journalDetail).then((data)=>{
            return data
        })
        if(_.isEmpty(addJournal) || _.isNull(addJournal)){
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })

            return res.status(400).json('An error occurred while creating journal entry')
        }


        journalDetail = {}
        journalDetail.j_acc_code = nhfPayrollCode.pj_code
        journalDetail.j_date = formatLastDayOfMonth
        journalDetail.j_ref_code = salaryMasterData.smm_ref_code
        journalDetail.j_desc = `${salaryMasterData.smm_month}-NHF`
        journalDetail.j_d_c = "C"
        journalDetail.j_amount = 0 - totalEmployeeNhf
        journalDetail.j_t1 = "u1000"
        journalDetail.j_t2 = "Null"
        journalDetail.j_t3 = "Null"
        journalDetail.j_t4 = '2NG'
        journalDetail.j_t5 = '2NGA'
        journalDetail.j_month = salaryMasterData.smm_month
        journalDetail.j_year = salaryMasterData.smm_year
        journalDetail.j_t6 = mappingLocationData.l_t6_code
        journalDetail.j_t7 = "null"
        journalDetail.j_name = "null"

        addJournal =  await journalService.addJournal(journalDetail).then((data)=>{
            return data
        })
        if(_.isEmpty(addJournal) || _.isNull(addJournal)){
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })

            return res.status(400).json('An error occurred while creating journal entry')
        }


        journalDetail = {}
        journalDetail.j_acc_code = payePayrollCode.pj_code
        journalDetail.j_date = formatLastDayOfMonth
        journalDetail.j_ref_code = salaryMasterData.smm_ref_code
        journalDetail.j_desc = `${salaryMasterData.smm_month}-PAYE`
        journalDetail.j_d_c = "C"
        journalDetail.j_amount = 0 - totalTax
        journalDetail.j_t1 = "u1000"
        journalDetail.j_t2 = "Null"
        journalDetail.j_t3 = "Null"
        journalDetail.j_t4 = '2NG'
        journalDetail.j_t5 = '2NGA'
        journalDetail.j_month = salaryMasterData.smm_month
        journalDetail.j_year = salaryMasterData.smm_year
        journalDetail.j_t6 = mappingLocationData.l_t6_code
        journalDetail.j_t7 = "null"
        journalDetail.j_name = "null"

        addJournal =  await journalService.addJournal(journalDetail).then((data)=>{
            return data
        })
        if(_.isEmpty(addJournal) || _.isNull(addJournal)){
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })

            return res.status(400).json('An error occurred while creating journal entry')
        }

        journalDetail = {}
        journalDetail.j_acc_code = netPayrollCode.pj_code
        journalDetail.j_date = formatLastDayOfMonth
        journalDetail.j_ref_code = salaryMasterData.smm_ref_code
        journalDetail.j_desc = `${salaryMasterData.smm_month}-NETPAY`
        journalDetail.j_d_c = "C"
        journalDetail.j_amount = 0 - totalNetSalary
        journalDetail.j_t1 = "u1000"
        journalDetail.j_t2 = "Null"
        journalDetail.j_t3 = "Null"
        journalDetail.j_t4 = '2NG'
        journalDetail.j_t5 = '2NGA'
        journalDetail.j_month = salaryMasterData.smm_month
        journalDetail.j_year = salaryMasterData.smm_year
        journalDetail.j_t6 = mappingLocationData.l_t6_code
        journalDetail.j_t7 = "null"
        journalDetail.j_name = "null"

        addJournal =   await journalService.addJournal(journalDetail).then((data)=>{
            return data
        })

        if(_.isEmpty(addJournal) || _.isNull(addJournal)){
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })

            return res.status(400).json('An error occurred while creating journal entry')
        }


        let pfas = await pensionProviderService.getAllPensionProviders().then((data) => {
            return data
        });

        let pensionPayments = await paymentDefinitionService.getPensionPayments().then((data) => {
            return data
        })
        if ((_.isNull(pensionPayments) || _.isEmpty(pensionPayments))) {
            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json(`No payments marked as pension`)
        }

        for(const pfa of pfas){

            let pfaEmployees = await salaryService.getEmployeesByPfaLocation(pfa.pension_provider_id, salaryMasterData.smm_location, salaryMasterData.smm_month, salaryMasterData.smm_year ).then((data) => {
                return data
            })

            let tempPfaEmployees = []
            for(const emp of pfaEmployees){
                let tempEmp = {
                    emp_unique_id: emp.salary_emp_unique_id,
                    emp_id: emp.salary_empid,
                    emp_d7: emp.salary_d7
                }
                tempPfaEmployees.push(tempEmp)
            }

            const employees = _.uniqWith(tempPfaEmployees, _.isEqual)


            let totalPension = 0
            for (const emp of employees) {

                if(empIdArray.includes(emp.emp_d7)){
                    for (const pensionPayment of pensionPayments) {
                        let amount = 0

                        let checkSalary = await salary.getEmployeeSalaryByD7AndMonthYear(emp.emp_d7, salaryMasterData.smm_month, salaryMasterData.smm_year, pensionPayment.pd_id).then((data) => {
                            return data
                        })
                        if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
                            amount = parseFloat(checkSalary.salary_amount)
                        }

                        totalPension = totalPension + amount
                    }
                }

            }

            if(totalPension > 0){
                journalDetail = {}
                journalDetail.j_acc_code = pfa.provider_code
                journalDetail.j_date = formatLastDayOfMonth
                journalDetail.j_ref_code = salaryMasterData.smm_ref_code
                journalDetail.j_desc = `${salaryMasterData.smm_month}-${pfa.provider_name}`
                journalDetail.j_d_c = "C"
                journalDetail.j_amount = 0 - totalPension
                journalDetail.j_t1 = "u1000"
                journalDetail.j_t2 = "Null"
                journalDetail.j_t3 = "Null"
                journalDetail.j_t4 = '2NG'
                journalDetail.j_t5 = '2NGA'
                journalDetail.j_month = salaryMasterData.smm_month
                journalDetail.j_year = salaryMasterData.smm_year
                journalDetail.j_t6 = mappingLocationData.l_t6_code
                journalDetail.j_t7 = "null"
                journalDetail.j_name = "null"

                addJournal =  await journalService.addJournal(journalDetail).then((data)=>{
                    return data
                })
                if(_.isEmpty(addJournal) || _.isNull(addJournal)){
                    await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                        return data
                    })
                    return res.status(400).json('An error occurred while creating journal entry')
                }
            }

        }

        const approveMaster = await salaryMappingMasterService.approveSalaryMappingMaster(salaryMasterData.smm_id).then((data)=>{
            return data
        })

        if(_.isEmpty(approveMaster) || _.isNull(approveMaster)){

            await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data)=>{
                return data
            })
            return res.status(400).json('An error occurred while approving salary mapping master')
        }

        for (const empId of empIdArray) {
            const employee = await employeeService.getEmployeeByD7(empId);
            const email = employee.emp_office_email;
            if(email){
                const templateParams = {
                    monthYear: `${salaryMasterData.smm_month} ${salaryMasterData.smm_year}`,
                    name: `${employee.emp_first_name} ${employee.emp_last_name}`,
                    monthNumber: parseInt(salaryMasterData.smm_month),
                    yearNumber: parseInt(salaryMasterData.smm_year),
                    department: employee.sector.department_name,
                    jobRole: employee.jobrole.job_role,
                    employeeId: employee.emp_unique_id,
                }
                await mailer.journalProcessedSendMail('noreply@ircng.org', email, 'TimeSheet Approved, Journal Processed', templateParams);   }
        }

        return res.status(200).json('Processed Successfully')
    } catch (err) {
        return res.status(400).json(err.message)
        // console.error( err.message);
        // next(err);
    }
});

router.get('/undo-salary-mapping/:masterId', auth(), async function (req, res, next) {
    try {

        const masterId = req.params['masterId']

        let salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        if (_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)) {
            return res.status(400).json('Salary Mapping Master Does not Exist')
        }

        await journalService.removeJournalByRefCode(salaryMasterData.smm_ref_code).then((data) => {
            return data
        })
        await  salaryMappingDetailsService.removeSalaryMappingDetails(salaryMasterData.smm_id).then((data) => {
            return data
        })

        await salaryMappingMasterService.removeSalaryMappingMaster(salaryMasterData.smm_id).then((data) => {
            return data
        })

        return res.status(200).json('Salary Mapping Undone Successfully')
    } catch (err) {
        return res.status(400).json(err.message)
    }
});

router.post('/get-Journal', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            j_month: Joi.string().required(),
            j_year: Joi.string().required(),
            j_location: Joi.number().required(),
        })
        const validationResult = schema.validate(req.body)
        const j_month = req.body.j_month
        const j_year = req.body.j_year
        const j_location = req.body.j_location

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let salaryMappingMaster = await salaryMappingMasterService.getSalaryMappingMasterByMonthYearLocation(j_month, j_year, j_location).then((data)=>{
            return data

        })

        if(_.isEmpty(salaryMappingMaster) || _.isNull(salaryMappingMaster)){
            return res.status(400).json('No salary mapping master found')
        }

        let journals = await journalService.getJournalByRefCode(salaryMappingMaster.smm_ref_code).then((data)=>{
            return   data
        });

        if(_.isEmpty(journals) || _.isNull(journals)){
            return res.status(400).json('No journals found')
        }

        return res.status(200).json(journals)

    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});


router.get('/test-unique-array', auth(), async function (req, res, next) {
    try {

        let array = [
            {
                "id": 1,
                "name": "John"
            },

            {
                "id": 2,
                "name": "John"
            }
        ]
        array = _.uniqWith(array, _.isEqual);
        return res.status(200).json(array)
    } catch (err) {
        return res.status(400).json(err.message)
        // console.error( err.message);
        // next(err);
    }
});

router.get('/test-pfa-journals/:masterId', auth(), async function (req, res, next) {
    try {
        const masterId = req.params['masterId']

        let salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId).then((data) => {
            return data
        })

        let details = await salaryMappingDetailsService.getSalaryMappingDetails(masterId).then((data) => {
            return data
        })
        salaryMasterData = JSON.parse(JSON.stringify(salaryMasterData));
        salaryMasterData.smm_total = details.length

        let empArray = [];

        for (const salaryMappingDetail of details) {
            let empObject = {
                employeeT7: salaryMappingDetail.smd_employee_t7,
                employeeTax: 0,
                netSalary: 0,
                employeeNhf: 0,
                employeeNsitf: 0

            }
            empArray.push(empObject)
        }


        empArray = _.uniqWith(empArray, _.isEqual)
        let totalTax = 0
        let totalNetSalary = 0
        let totalEmployeeNhf = 0
        let totalEmployeeNsitf = 0
        let empIdArray = [];

        for(const emp of empArray){
            totalTax = totalTax + emp.employeeTax
            totalNetSalary = totalNetSalary + emp.netSalary
            totalEmployeeNhf = totalEmployeeNhf + emp.employeeNhf
            totalEmployeeNsitf  = totalEmployeeNsitf + emp.employeeNsitf
            empIdArray.push(emp.employeeT7)
        }



        let pfas = await pensionProviderService.getAllPensionProviders().then((data) => {
            return data
        });

        let pensionPayments = await paymentDefinitionService.getPensionPayments().then((data) => {
            return data
        })

        let pensionArrays = [];
        let employeePenArrays =[];

        for(const pfa of pfas){


            let employees = await employeeService.getEmployeesByPfaLocation(pfa.pension_provider_id, 1).then((data) => {
                return data
            })
            let totalPension = 0
            for (const emp of employees) {
                let amount = 0
                let countEmployees = 0;

                if(empIdArray.includes(emp.emp_unique_id)){

                    for (const pensionPayment of pensionPayments) {


                        let checkSalary = await salary.getEmployeeSalaryMonthYearPd(salaryMasterData.smm_month, salaryMasterData.smm_year, emp.emp_id, pensionPayment.pd_id).then((data) => {
                            return data
                        })
                        if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
                            amount = amount + parseFloat(checkSalary.salary_amount)
                        }
                    }

                    if(amount > 0){
                        countEmployees++;
                    }
                }


                totalPension = totalPension + amount

            }


            let pensionObject = {
                totalPension: totalPension,
                pfa: pfa.provider_name,
                totalEmployees: countEmployees,
            }
            pensionArrays.push(
                pensionObject
            )



        }


        return res.status(200).json(pensionArrays);
    } catch (err) {
        return res.status(400).json(err.message)
        // console.error( err.message);
        // next(err);
    }
});

router.delete('/delete-salary-mapping/:masterId', auth(), async function (req, res, next) {
    const masterId = req.params['masterId']
    try {
        const salaryMasterData = await salaryMappingMasterService.getSalaryMappingMaster(masterId);
        if (_.isEmpty(salaryMasterData) || _.isNull(salaryMasterData)) {
            return res.status(400).json('No salary mapping master found')
        }

        if (salaryMasterData.smm_posted === 1) {
            return res.status(400).json('Salary mapping master has been approved and cannot be deleted')
        }

        await salaryMappingMasterService.removeSalaryMappingMaster(masterId);

        await salaryMappingDetailsService.removeSalaryMappingDetails(masterId);


        return res.status(200).json('Salary mapping master deleted successfully')
    } catch (err) {
        return res.status(400).json(err.message)
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

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}



module.exports = router;
