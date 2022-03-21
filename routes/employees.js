const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted')
const _ = require('lodash')
const logs = require('../services/logService')
const employees = require('../services/employeeService')
const documents = require('../services/employeeDocumentsService')
const supervisorAssignment = require('../services/supervisorAssignmentService');
const auth = require("../middleware/auth");
const Joi = require("joi");
const fs = require('fs');
const AWS = require('aws-sdk');
const dotenv = require('dotenv');
const path = require('path')
const user = require("../services/userService");
const s3 = new AWS.S3({
    accessKeyId: `${process.env.ACCESS_KEY}`,
    secretAccessKey: `${process.env.SECRET_KEY}`
});


/* GET employees. */
router.get('/', auth, employees.getAllEmployee);
/*router.get('/getemployee', async function(req, res, next){

})*/

router.get('/get-employee/:emp_id', auth, async function (req, res, next) {
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

router.post('/employee-enrollment', auth, employees.createNewEmployee);

router.patch('/update-employee/:emp_id', auth, async function (req, res, next) {
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
router.patch('/update-employee-backoffice/:emp_id', auth, async function (req, res, next) {
    try {
        let empId = req.params['emp_id']
        await employees.getEmployee(empId).then((data) => {
            if (_.isEmpty(data)) {
                return res.status(400).json(`Employee Doesn't Exist`)
            } else {
                const employeeData = req.body
                employees.updateEmployeeFromBackoffice(empId, employeeData).then((data) => {
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


router.patch('/suspend-employee/:emp_id', auth, async function (req, res, next) {
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


router.patch('/upload-profile-pic/:empId', auth, async function (req, res, next) {
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


router.post('/upload-documents/:empId', auth, async function (req, res, next) {
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


router.post('/set-supervisor', auth, async function (req, res, next) {
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

router.get('/get-supervisor', auth, async function (req, res, next) {
    try {
        await employees.getSupervisors().then((data) => {
            return res.status(200).json(data)
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status`, err.message);
        next(err);
    }
});

router.get('/get-none-supervisor', auth, async function (req, res, next) {
    try {
        await employees.getNoneSupervisors().then((data) => {
            return res.status(200).json(data)
        })
    } catch (err) {
        console.error(`An error occurred while updating supervisor status`, err.message);
        next(err);
    }
});

router.get('/get-supervisor-employees/:emp_id', auth, async function (req, res, next) {
    try {
        let empId = req.params.emp_id
        const employeeData = await employees.getEmployee(empId).then((data) => {
            return data
        })

        if (_.isEmpty(employeeData) || _.isNull(employeeData)) {
            return res.status(400).json(` Employee Does Not exist`)
        } else {
            await employees.getSupervisorEmployee(empId).then((data) => {
                return res.status(200).json(data)
            })
        }

    } catch (err) {
        console.error(`An error occurred while fetching`, err.message);
        next(err);
    }
});

router.post('/upload-files', auth, async function (req, res, next) {
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

router.get('/get-documents/:emp_id', auth, async function (req, res, next) {
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

router.post('/change-password', employees.changePassword);
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
