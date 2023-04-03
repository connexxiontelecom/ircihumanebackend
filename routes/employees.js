const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted')
const _ = require('lodash')
const logs = require('../services/logService')
const employees = require('../services/employeeService')
const documents = require('../services/employeeDocumentsService')
const isWeekend = require('date-fns/isWeekend')
const IRCMailerService = require('../services/IRCMailer')
const supervisorAssignment = require('../services/supervisorAssignmentService');
const auth = require("../middleware/auth");
const Joi = require("joi");
const fs = require('fs');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const path = require('path')
const user = require("../services/userService");
const {sequelize, Sequelize} = require("../services/db");
const {isAfter} = require("date-fns");
const salaryMappingMasterService = require("../services/salaryMappingMasterService");
const https = require("https");
const salaryMappingDetailsService = require("../services/salaryMappingDetailService");
const reader = require("xlsx");
const employeeService = require("../services/employeeService");
const timeAllocationService = require("../services/timeAllocationService");
const supervisorModel = require('../models/supervisorassignment')(sequelize, Sequelize.DataTypes);
const notificationModel = require('../models/notification')(sequelize, Sequelize.DataTypes);
const selfAssessmentMasterModel = require('../models/selfassessmentmaster')(sequelize, Sequelize.DataTypes);
const employeeModel = require('../models/Employee')(sequelize, Sequelize.DataTypes);

const ReportingEntityModel = require("../models/reportingentity")(sequelize, Sequelize.DataTypes);
const OperationUnitModel = require("../models/operationunit")(sequelize, Sequelize.DataTypes);
const FunctionalAreaModel = require("../models/functionalarea")(sequelize, Sequelize.DataTypes);

const s3 = new AWS.S3({
    accessKeyId: `${process.env.ACCESS_KEY}`,
    secretAccessKey: `${process.env.SECRET_KEY}`
});


/* GET employees. */
router.get('/', auth(), employees.getAllEmployee);
/*router.get('/getemployee', async function(req, res, next){

})*/

router.get('/get-employee/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params['emp_id']
        await employees.getEmployee(empId).then((data) => {
            if (_.isEmpty(data)) {
                return res.status(404).json(`Employee Doesn't Exist`)
            } else {
                return res.status(200).json(data)
            }
        })

    } catch (err) {
        console.error(`An error occurred while fetching Employee `, err.message);
        next(err);
    }
})

router.post('/employee-enrollment', auth(), employees.createNewEmployee);

router.patch('/update-employee/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params['emp_id']
        await employees.getEmployee(empId).then((data) => {
            if (_.isEmpty(data)) {
                return res.status(400).json(`Employee Doesn't Exist`)
            } else {
                const employeeData = req.body
                employees.updateEmployee(empId, employeeData).then((data) => {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Updated Employee Details",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {

                        return res.status(200).json('Action Successful')
                    })
                })

            }
        })

    } catch (err) {
        console.error(`An error occurred while updating Employee `, err.message);
        next(err);
    }
});

router.patch('/update-employee-backoffice/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params['emp_id']
       const checkEmployee =  await employees.getEmployee(empId);
        if (_.isEmpty(checkEmployee)) {
            return res.status(400).json(`Employee Doesn't Exist`)
        }
            const employeeData = req.body
            const employeeContractEndDate = new Date(employeeData.emp_contract_end_date)

            // const checkEmployeeHireDateWeekend = await isWeekend(employeeHireDate)
            //
            // const checkEmployeeContractEndDateWeekend = await isWeekend(employeeContractEndDate)
            //
            // if(checkEmployeeContractEndDateWeekend || checkEmployeeHireDateWeekend){
            //     return res.status(400).json('Hire date or contract end date cannot be a weekend')
            // }
            await employees.updateEmployeeFromBackoffice(empId, employeeData)
            const result = isAfter(employeeContractEndDate, new Date())
            if(result){
                await employees.unSuspendEmployee(empId);
                await user.unSuspendUser(checkEmployee.emp_unique_id)
            }
            return res.status(200).json('employee updated');
    } catch (err) {
        console.error(`An error occurred while updating Employee `, err.message);
        next(err);
    }
});


router.patch('/suspend-employee/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params['emp_id']
        const schema = Joi.object({
            emp_suspension_reason: Joi.string().required(),
        })

        const suspensionRequest = req.body
        const validationResult = schema.validate(suspensionRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }


        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData)) {
            return res.status(400).json(`Employee Doesn't Exist`)
        }

        const supervisorCheck = await supervisorAssignment.getSupervisorEmployee(empId).then((data) => {
            return data
        })

        if (!_.isEmpty(supervisorCheck)) {
            return res.status(400).json('Employee is assigned as supervisor to an employee')
        }

        // if(parseInt(employeeData.emp_supervisor_status) ===1 ){
        //     return res.status(400).json(`Employee is a supervisor, kindly remove from supervisor role`)
        // }

        const suspendResponse = await employees.suspendEmployee(empId, suspensionRequest.emp_suspension_reason).then((data) => {
            return data
        })

        if (_.isEmpty(suspendResponse) || _.isNull(suspendResponse)) {
            return res.status(400).json(`An Error Occurred`)
        }

        let suspendUser = await user.suspendUser(employeeData.emp_unique_id).then((data) => {
            return data
        })

        if (_.isEmpty(suspendUser) || _.isNull(suspendUser)) {
            const unsuspendEmployee = await employees.unSuspendEmployee(empId).then((data) => {
                return data
            })
            return res.status(400).json(`An Error Occurred`)
        } else {
            const logData = {
                "log_user_id": req.user.username.user_id,
                "log_description": "Suspended Employee",
                "log_date": new Date()
            }
            await logs.addLog(logData).then((logRes) => {

                return res.status(200).json('Action Successful')
            })

        }


    } catch (err) {
        console.error(`An error occurred while updating Employee `, err.message);
        next(err);
    }
});

router.patch('/unsuspend-employee/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params['emp_id']
   /*     const schema = Joi.object({
            emp_suspension_reason: Joi.string().required(),
        })

        const suspensionRequest = req.body
        const validationResult = schema.validate(suspensionRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }*/


        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData)) {
            return res.status(400).json(`Employee Doesn't Exist`)
        }

        const suspendResponse = await employees.unSuspendEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(suspendResponse) || _.isNull(suspendResponse)) {
            return res.status(400).json(`An Error Occurred`)
        }
          const logData = {
              "log_user_id": req.user.username.user_id,
              "log_description": "Suspended Employee",
              "log_date": new Date()
          }
          await logs.addLog(logData).then((logRes) => {

              return res.status(200).json('Action Successful')
          });

    } catch (err) {
        console.error(`An error occurred while updating Employee `, err.message);
        next(err);
    }
});


router.patch('/upload-profile-pic/:empId', auth(), async function (req, res, next) {
    try {
        let empId = req.params['empId']
        const employeeDatum = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeDatum)) {
            return res.status(400).json(`Employee Doesn't Exist`)
        }

        const uploadResponse = await uploadFile(req.files.profilepic).then((response) => {
            return response
        }).catch(err => {
            return res.status(400).json(err)
        })

        const employeeData = {
            emp_passport: uploadResponse
        }
        let employeeUpdateResponse = await employees.updateProfilePicture(empId, employeeData).then((data) => {
            return data
        })

        if (_.isEmpty(employeeUpdateResponse)) {
            return res.status(400).json('An error occurred, please try again')
        }

        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Updated Employee Profile",
            "log_date": new Date()
        }
        await logs.addLog(logData).then((logRes) => {

            return res.status(200).json('Action Successful')
        })


    } catch (err) {
        console.error(`An error occurred while updating Employee `, err.message);
        next(err);
    }
});


router.post('/upload-documents/:empId', auth(), async function (req, res, next) {
    try {

        let empId = req.params['empId']
        const employeeDatum = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeDatum)) {
            return res.status(400).json(`Employee Doesn't Exist`)
        }
        let docs = req.files.documents
        if (Array.isArray(docs)) {

            let success = [];

            for (const doc of docs) {
                const uploadResponse = await uploadFile(doc).then((response) => {
                    return response
                })
                if (_.isEmpty(uploadResponse) || _.isNull(uploadResponse)) {
                    if (!(_.isEmpty(success) || _.isNull(success))) {
                        for (const failure of success) {
                            let removeResponse = documents.deleteEmployeeDocument(failure).then((data) => {
                                return data
                            })
                        }
                        return res.status(400).json(`An error occurred while uploading documents`)
                    }
                    return res.status(400).json(`An error occurred while uploading documents`)
                }
                const documentData = {
                    ed_empid: empId,
                    ed_doc: uploadResponse,
                    ed_filename: doc.name
                }
                let documentAddResponse = await documents.addEmployeeDocument(documentData).then((data) => {
                    return data
                })
                if (_.isEmpty(documentAddResponse) || _.isNull(documentAddResponse)) {
                    if (!(_.isEmpty(success) || _.isNull(success))) {
                        for (const failure of success) {
                            let removeResponse = documents.deleteEmployeeDocument(failure).then((data) => {
                                return data
                            })
                        }
                        return res.status(400).json(`An error occurred while uploading documents`)
                    }

                    return res.status(400).json(`An error occurred while uploading documents`)
                }
                success.push(uploadResponse)
            }

            return res.status(200).json(`Action Successful`)
        } else {
            const uploadResponse = await uploadFile(docs).then((response) => {
                return response
            }).catch(err => {
                return res.status(400).json(err)
            })

            const documentData = {
                ed_empid: empId,
                ed_doc: uploadResponse,
                ed_filename: docs.name
            }

            let documentAddResponse = await documents.addEmployeeDocument(documentData).then((data) => {
                return data
            })
            if (_.isEmpty(documentAddResponse) || _.isNull(documentAddResponse)) {
                return res.status(400).json('An Error Occurred while Uploading documents')
            }
            return res.status(200).json('Action Successful')
        }

    } catch (err) {
        console.error(`An error occurred while updating supervisor status `, err.message);
        next(err);
    }
});


router.post('/set-supervisor', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            emp_supervisor_status: Joi.number().required(),
            emp_id: Joi.number().required()
        })

        const supervisorRequest = req.body
        const validationResult = schema.validate(supervisorRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        if (parseInt(supervisorRequest.emp_supervisor_status) === 0) {
            const supervisorCheck = await supervisorAssignment.getSupervisorEmployee(supervisorRequest.emp_id).then((data) => {
                return data
            })

            if (supervisorCheck) {
                return res.status(400).json('Employee is assigned as supervisor to an employee')
            }


        }

        await employees.setSupervisorStatus(supervisorRequest).then((data) => {
            if (_.isEmpty(data)) {

                return res.status(400).json('An error occurred while updating supervisor status')

            } else {
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Updated Employee Supervisor Status",
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes) => {

                    return res.status(200).json('Supervisor Status Updated')
                })
            }
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status `, err.message);
        next(err);
    }
});

router.get('/get-supervisor', auth(), async function (req, res, next) {
    try {
        await employees.getSupervisors().then((data) => {
            return res.status(200).json(data)
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status`, err.message);
        next(err);
    }
});

router.get('/get-none-supervisor', auth(), async function (req, res, next) {
    try {
        await employees.getNoneSupervisors().then((data) => {
            return res.status(200).json(data)
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status`, err.message);
        next(err);
    }
});

router.get('/get-supervisor-employees/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(` Employee Does Not exist`)
        } else {
          const listOfEmps = await employeeModel.getListOfEmployeesSupervising(empId);

          const empIds = [];
             listOfEmps.map((emp)=>{
               empIds.push(emp.emp_id)
             })
             const submission = await selfAssessmentMasterModel.getSupervisorSelfAssessment(empIds);
           return res.status(200).json(submission)

           /* await employees.getSupervisorEmployee(empId).then((data) => {
                return res.status(200).json(data)
            })*/
        } //$2a$10$PhxUR8PJO43/RmQplPmrx.hM0RUyyRrlz3WqgHgk/rYobwe4EBTt.

    } catch (err) {
        console.error(`An error occurred while fetching`);
        next(err);
    }
});

router.post('/upload-files', auth(), async function (req, res, next) {
    try {

        return res.status(200).json(req.files.test)
        let uploadResponse = await uploadFile(req.files.test).then((response) => {
            return response
        }).catch(err => {
            return res.status(400).json(err)
        })
        return res.status(200).json(uploadResponse)
    } catch (err) {
        console.error(`An error occurred while updating supervisor status `, err.message);
        next(err);
    }
});

router.get('/get-documents/:emp_id', auth(), async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(` Employee Does Not exist`)
        } else {
            await documents.getEmployeeDocument(empId).then((data) => {
                return res.status(200).json(data)
            })
        }

    } catch (err) {
        console.error(`An error occurred while fetching`, err.message);
        next(err);
    }
});

router.post('/change-password', auth(), employees.changePassword);

router.post('/get-employee-report', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            type: Joi.any().required(),
        })

        const employeeRequest = req.body
        const validationResult = schema.validate(employeeRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        let employeesArray = []
        if (typeof employeeRequest.type === 'string') {
            if (employeeRequest.type === 'all') {
                employeesArray = await employees.getEmployees().then((data) => {
                    return data
                })
            } else {
                return res.status(400).json('Invalid Parameters Sent')
            }
        } else if (typeof employeeRequest.type === 'number') {
            if (parseInt(employeeRequest.type) === 1) {
                employeesArray = await employees.getActiveEmployees().then((data) => {
                    return data
                })
            } else if (parseInt(employeeRequest.type) === 0) {
                employeesArray = await employees.getInactiveEmployees().then((data) => {
                    return data
                })
            } else {
                return res.status(400).json('Invalid Parameters Sent')
            }
        }
        return res.status(200).json(employeesArray)

    } catch (err) {
        return res.status(200).json(`An error occurred while fetching Employee `);
        next(err);
    }
})


router.get('/get-d-codes/:type', async function(req, res){
  try{
    const type = req.params.type;
    let data = null;
    switch(type){
      case 'd4':
        data = await OperationUnitModel.getAllOperationUnits();
        break;
      case 'd5':
        data = await ReportingEntityModel.getAllReportingEntities();
        break;
      case 'd6':
        data = await FunctionalAreaModel.getAllFunctionalAreas();
        break;
      default:
        data = null;
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again.");
  }
});

router.post('/upload-contract-end-date', auth(), async function (req, res, next) {
    try {
        const file = await fs.createWriteStream("contract_end_date.xlsx")
        let fileExt = path.extname(req.files.contract_end.name)
        fileExt = fileExt.toLowerCase()
        if (fileExt === '.csv' || fileExt === '.xlsx' || fileExt === '.xls') {
            let uploadResponse = await uploadFile(req.files.contract_end).then((response) => {
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

        if (fs.existsSync('./contract_end_date.xlsx')) {
            await fs.unlinkSync('./contract_end_date.xlsx')
        }
        return res.status(400).json('Invalid file Type')
    } catch (err) {
        if (fs.existsSync('./contract_end_date.xlsx')) {
            await fs.unlinkSync('./contract_end_date.xlsx')
        }
        return res.status(400).json(err.message)

    }
});

router.get('/process-contract-end-date', auth(), async function (req, res, next) {
    try {

        await sleep(60000);

        if (!fs.existsSync('./contract_end_date.xlsx')) {
            return res.status(400).json('File has not been uploaded')
        }
        const files = await reader.readFile('./contract_end_date.xlsx')
        let rows = []
        const sheets = files.SheetNames

        for (let i = 0; i < sheets.length; i++) {
            const temp = reader.utils.sheet_to_json(files.Sheets[files.SheetNames[i]])
            for (const res1 of temp) {
                rows.push(res1)
            }
        }

        if (_.isEmpty(rows) || _.isNull(rows)) {
            return res.status(400).json('File has not been uploaded')
        }

        for (const row of rows) {
            const { d7, date } = row;

            if (d7 && date) {
                const employeeData = await employees.getEmployeeByD7(d7);

                if (!_.isEmpty(employeeData) && !_.isNull(employeeData)) {
                    await employees.updateContractDate(employeeData.emp_id, { emp_contract_end_date: date });
                }
            }
        }
        await fs.unlinkSync('./contract_end_date.xlsx')
        return res.status(200).json('Contract EndDate uploaded successfully')
    } catch (err) {
        console.error(err.message);
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

router.post('/swap-relocatable-status', async function(req, res){
  try {
    const schema = Joi.object({
      empId: Joi.number().required(),
      status: Joi.number().required(),
    })

    const updateRequest = req.body
    const validationResult = schema.validate(updateRequest)

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
  const emp = await employeeModel.getEmployeeById(parseInt(req.body.empId));
    if(_.isNull(emp) || _.isEmpty(emp)){
      return res.status(400).json("No record found.");
    }
    const updateEmp = await employeeModel.updateEmployeeRelocatableStatus(parseInt(req.body.empId), parseInt(req.body.status));
    return res.status(200).json("Record updated!")

  } catch (err) {
    return res.status(200).json(`An error occurred while fetching Employee `);
  }
});

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
module.exports = router;
