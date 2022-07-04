const Joi = require('joi')
const express = require('express');
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const auth = require("../middleware/auth");
const users = require('../services/userService');
const logs = require("../services/logService");
const employees = require("../services/employeeService");
const {sequelize, Sequelize} = require('../services/db');
const notificationModel = require("../models/notification")(sequelize, Sequelize.DataTypes);
const permissionService = require("../services/permissionService");
const ROLES = require('../roles')
const _ = require('lodash')
const mailer = require("../services/IRCMailer");
const employee = require("../services/employeeService");


/* Get All Users */
router.get('/', auth(), async function (req, res, next) {
    try {

        let userData = await users.findAllUsers().then((data) => {
           return data
        })

        userData = JSON.parse( JSON.stringify( userData ) );
        let userArray = [];
        for (const user of userData) {
            let userPermission = [ ]
            const permissionData = await permissionService.getPermission(user.user_id).then((data)=>{
                return data
            })
            if(!_.isEmpty(permissionData)){

                if(parseInt(permissionData.perm_manage_user) === 1){
                    userPermission.push('MANAGE_USER')
                }

                if(parseInt(permissionData.perm_hr_config) === 1){
                    userPermission.push('HR_CONFIG')
                }
                if(parseInt(permissionData.perm_payroll_config) === 1){
                    userPermission.push('PAYROLL_CONFIG')
                }

                if(parseInt(permissionData.perm_payment_definition) === 1){
                    userPermission.push('PAYMENT_DEFINITION')
                }

                if(parseInt(permissionData.perm_onboard_employee) === 1){
                    userPermission.push('ONBOARD_EMPLOYEE')
                }

                if(parseInt(permissionData.perm_manage_employee) === 1){
                    userPermission.push('MANAGE_EMPLOYEE')
                }

                if(parseInt(permissionData.perm_assign_supervisors) === 1){
                    userPermission.push('ASSIGN_SUPERVISORS')
                }

                if(parseInt(permissionData.perm_announcement) === 1){
                    userPermission.push('ANNOUNCEMENT')
                }

                if(parseInt(permissionData.perm_query) === 1){
                    userPermission.push('QUERY')
                }

                if(parseInt(permissionData.perm_leave) === 1){
                    userPermission.push('LEAVE')
                }

                if(parseInt(permissionData.perm_travel) === 1){
                    userPermission.push('TRAVEL')
                }

                if(parseInt(permissionData.perm_timesheet) === 1){
                    userPermission.push('TIMESHEET')
                }

                if(parseInt(permissionData.perm_self_assessment) === 1){
                    userPermission.push('SELF_ASSESSMENT')
                }

                if(parseInt(permissionData.perm_leave_management) === 1){
                    userPermission.push('LEAVE_MANAGEMENT')
                }

                if(parseInt(permissionData.perm_setup_variations) === 1){
                    userPermission.push('SETUP_VARIATIONS')
                }

                if(parseInt(permissionData.perm_confirm_variations) === 1){
                    userPermission.push('CONFIRM_VARIATIONS')
                }

                if(parseInt(permissionData.perm_approve_variations) === 1){
                    userPermission.push('APPROVE_VARIATIONS')
                }

                if(parseInt(permissionData.perm_decline_variations) === 1){
                    userPermission.push('DECLINE_VARIATIONS')
                }
                if(parseInt(permissionData.perm_run_payroll) === 1){
                    userPermission.push('RUN_PAYROLL')
                }

                if(parseInt(permissionData.perm_undo_payroll) === 1){
                    userPermission.push('UNDO_PAYROLL')
                }

                if(parseInt(permissionData.perm_confirm_payroll) === 1){
                    userPermission.push('CONFIRM_PAYROLL')
                }

                if(parseInt(permissionData.perm_approve_payroll) === 1){
                    userPermission.push('APPROVE_PAYROLL')
                }

                if(parseInt(permissionData.perm_journal_code_setup) === 1){
                    userPermission.push('JOURNAL_CODE_SETUP')
                }

                if(parseInt(permissionData.perm_salary_mapping) === 1){
                    userPermission.push('SALARY_MAPPING')
                }

                if(parseInt(permissionData.perm_undo_salary_mapping) === 1){
                    userPermission.push('UNDO_SALARY_MAPPING')
                }

                if(parseInt(permissionData.perm_payroll_journal) === 1){
                    userPermission.push('PAYROLL_JOURNAL')
                }

                if(parseInt(permissionData.perm_application_tracking) === 1){
                    userPermission.push('APPLICATION_TRACKING')
                }

                if(parseInt(permissionData.perm_supervisor_reassignment) === 1){
                    userPermission.push('SUPERVISOR_REASSIGNMENT')
                }
                user.permission = userPermission
                user.permissionData = permissionData
            }

            userArray.push(user)
        }

        return res.status(200).json(userArray);
    } catch (err) {
        return res.status(400).json(`Error while fetching users ${err.message}`)
    }
});


/* Add User */
router.post('/add-user', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_password: Joi.string().min(5).required(),
            user_password_repeat: Joi.ref('user_password'),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
            perm_manage_user: Joi.number().required(),
            perm_hr_config: Joi.number().required(),
            perm_payroll_config: Joi.number().required(),
            perm_payment_definition: Joi.number().required(),
            perm_onboard_employee: Joi.number().required(),
            perm_manage_employee: Joi.number().required(),
            perm_assign_supervisors: Joi.number().required(),
            perm_announcement: Joi.number().required(),
            perm_query: Joi.number().required(),
            perm_leave: Joi.number().required(),
            perm_travel: Joi.number().required(),
            perm_timesheet: Joi.number().required(),
            perm_self_assessment: Joi.number().required(),
            perm_leave_management: Joi.number().required(),
            perm_setup_variations: Joi.number().required(),
            perm_confirm_variations: Joi.number().required(),
            perm_approve_variations: Joi.number().required(),
            perm_decline_variations: Joi.number().required(),
            perm_run_payroll: Joi.number().required(),
            perm_undo_payroll: Joi.number().required(),
            perm_confirm_payroll: Joi.number().required(),
            perm_approve_payroll: Joi.number().required(),
            perm_journal_code_setup: Joi.number().required(),
            perm_salary_mapping: Joi.number().required(),
            perm_undo_salary_mapping: Joi.number().required(),
            perm_payroll_journal: Joi.number().required(),
            perm_application_tracking: Joi.number().required(),
            perm_supervisor_reassignment: Joi.number().required(),
        })


        const validationResult = schema.validate(req.body)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const user = {
            user_username: req.body.user_username,
            user_name: req.body.user_name,
            user_email: req.body.user_email,
            user_password: req.body.user_password,
            user_password_repeat: req.body.user_password_repeat,
            user_type: req.body.user_type,
            user_token: req.body.user_token,
            user_status: req.body.user_status,
        }
        delete user.user_password_repeat;
        const checkEmail = await users.findUserByEmail(user.user_email).then((data) => {
            return data
        })
        if (checkEmail) {
            return res.status(400).json('Email Already taken')
        }
        const checkUsername = await users.findUserByUsername(user.user_username).then((data) => {
            return data
        })

        if (checkUsername) {
            return res.status(400).json('Username Already taken')
        }

        const addUser = await users.addUser(user).then((data) => {
            return data
        })

        if (addUser) {
            const permissionObject = {
                perm_user_id: addUser.user_id,
                perm_manage_user: req.body.perm_manage_user,
                perm_hr_config: req.body.perm_hr_config,
                perm_payroll_config: req.body.perm_payroll_config,
                perm_payment_definition: req.body.perm_payment_definition,
                perm_onboard_employee: req.body.perm_onboard_employee,
                perm_manage_employee: req.body.perm_manage_employee,
                perm_assign_supervisors: req.body.perm_assign_supervisors,
                perm_announcement: req.body.perm_announcement,
                perm_query: req.body.perm_query,
                perm_leave: req.body.perm_leave,
                perm_travel: req.body.perm_travel,
                perm_timesheet: req.body.perm_timesheet,
                perm_self_assessment: req.body.perm_self_assessment,
                perm_leave_management: req.body.perm_leave_management,
                perm_setup_variations: req.body.perm_setup_variations,
                perm_confirm_variations: req.body.perm_confirm_variations,
                perm_approve_variations: req.body.perm_approve_variations,
                perm_decline_variations: req.body.perm_decline_variations,
                perm_run_payroll: req.body.perm_run_payroll,
                perm_undo_payroll: req.body.perm_undo_payroll,
                perm_confirm_payroll: req.body.perm_confirm_payroll,
                perm_approve_payroll: req.body.perm_approve_payroll,
                perm_journal_code_setup: req.body.perm_journal_code_setup,
                perm_salary_mapping: req.body.perm_salary_mapping,
                perm_undo_salary_mapping: req.body.perm_undo_salary_mapping,
                perm_payroll_journal: req.body.perm_payroll_journal,
                perm_application_tracking: req.body.perm_application_tracking,
                perm_supervisor_reassignment: req.body.perm_supervisor_reassignment,
            }
            const addPermission = await permissionService.addPermission(permissionObject).then((data) => {
                return data
            })

            if (addPermission) {
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": "Added new user",
                    "log_date": new Date()
                }
               await logs.addLog(logData).then((logRes) => {
                    return res.status(200).json(addUser)
                })
            }

            const deleteUser = await users.deleteUser(addUser.user_id).then((data) => {
                return data
            })

            const deletePermission = await permissionService.deletePermission(addUser.user_id).then((data) => {
                return data
            })

            return res.status(400).json('An Error Occurred While adding User')

        }
        return res.status(400).json('An Error Occurred While adding User')


        // return  res.status(200).json(data)
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});

/* UpdateUser */
router.patch('/update-user/:user_id', auth(), async function (req, res, next) {
    try {

        const schemaWithoutPassword = Joi.object({
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
            perm_manage_user: Joi.number().required(),
            perm_hr_config: Joi.number().required(),
            perm_payroll_config: Joi.number().required(),
            perm_payment_definition: Joi.number().required(),
            perm_onboard_employee: Joi.number().required(),
            perm_manage_employee: Joi.number().required(),
            perm_assign_supervisors: Joi.number().required(),
            perm_announcement: Joi.number().required(),
            perm_query: Joi.number().required(),
            perm_leave: Joi.number().required(),
            perm_travel: Joi.number().required(),
            perm_timesheet: Joi.number().required(),
            perm_self_assessment: Joi.number().required(),
            perm_leave_management: Joi.number().required(),
            perm_setup_variations: Joi.number().required(),
            perm_confirm_variations: Joi.number().required(),
            perm_approve_variations: Joi.number().required(),
            perm_decline_variations: Joi.number().required(),
            perm_run_payroll: Joi.number().required(),
            perm_undo_payroll: Joi.number().required(),
            perm_confirm_payroll: Joi.number().required(),
            perm_approve_payroll: Joi.number().required(),
            perm_journal_code_setup: Joi.number().required(),
            perm_salary_mapping: Joi.number().required(),
            perm_undo_salary_mapping: Joi.number().required(),
            perm_payroll_journal: Joi.number().required(),
            perm_application_tracking: Joi.number().required(),
            perm_supervisor_reassignment: Joi.number().required(),
        })

        const schemaWithPassword = Joi.object({
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_password: Joi.string().min(5).required(),
            user_password_repeat: Joi.ref('user_password'),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
            perm_manage_user: Joi.number().required(),
            perm_hr_config: Joi.number().required(),
            perm_payroll_config: Joi.number().required(),
            perm_payment_definition: Joi.number().required(),
            perm_onboard_employee: Joi.number().required(),
            perm_manage_employee: Joi.number().required(),
            perm_assign_supervisors: Joi.number().required(),
            perm_announcement: Joi.number().required(),
            perm_query: Joi.number().required(),
            perm_leave: Joi.number().required(),
            perm_travel: Joi.number().required(),
            perm_timesheet: Joi.number().required(),
            perm_self_assessment: Joi.number().required(),
            perm_leave_management: Joi.number().required(),
            perm_setup_variations: Joi.number().required(),
            perm_confirm_variations: Joi.number().required(),
            perm_approve_variations: Joi.number().required(),
            perm_decline_variations: Joi.number().required(),
            perm_run_payroll: Joi.number().required(),
            perm_undo_payroll: Joi.number().required(),
            perm_confirm_payroll: Joi.number().required(),
            perm_approve_payroll: Joi.number().required(),
            perm_journal_code_setup: Joi.number().required(),
            perm_salary_mapping: Joi.number().required(),
            perm_undo_salary_mapping: Joi.number().required(),
            perm_payroll_journal: Joi.number().required(),
            perm_application_tracking: Joi.number().required(),
            perm_supervisor_reassignment: Joi.number().required(),
        })

        let validationResult;
        let user;
        if (req.body.user_password) {
            validationResult = schemaWithPassword.validate(req.body)
             user = {
                user_username: req.body.user_username,
                user_name: req.body.user_name,
                user_email: req.body.user_email,
                user_password: req.body.user_password,
                user_password_repeat: req.body.user_password_repeat,
                user_type: req.body.user_type,
                user_token: req.body.user_token,
                user_status: req.body.user_status,
            }
            delete user.user_password_repeat;
        } else {
            validationResult = schemaWithoutPassword.validate(req.body)
            user = {
                user_username: req.body.user_username,
                user_name: req.body.user_name,
                user_email: req.body.user_email,
                user_type: req.body.user_type,
                user_token: req.body.user_token,
                user_status: req.body.user_status,
            }
        }


        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        const permissionObject = {
            perm_user_id: req.params['user_id'],
            perm_manage_user: req.body.perm_manage_user,
            perm_hr_config: req.body.perm_hr_config,
            perm_payroll_config: req.body.perm_payroll_config,
            perm_payment_definition: req.body.perm_payment_definition,
            perm_onboard_employee: req.body.perm_onboard_employee,
            perm_manage_employee: req.body.perm_manage_employee,
            perm_assign_supervisors: req.body.perm_assign_supervisors,
            perm_announcement: req.body.perm_announcement,
            perm_query: req.body.perm_query,
            perm_leave: req.body.perm_leave,
            perm_travel: req.body.perm_travel,
            perm_timesheet: req.body.perm_timesheet,
            perm_self_assessment: req.body.perm_self_assessment,
            perm_leave_management: req.body.perm_leave_management,
            perm_setup_variations: req.body.perm_setup_variations,
            perm_confirm_variations: req.body.perm_confirm_variations,
            perm_approve_variations: req.body.perm_approve_variations,
            perm_decline_variations: req.body.perm_decline_variations,
            perm_run_payroll: req.body.perm_run_payroll,
            perm_undo_payroll: req.body.perm_undo_payroll,
            perm_confirm_payroll: req.body.perm_confirm_payroll,
            perm_approve_payroll: req.body.perm_approve_payroll,
            perm_journal_code_setup: req.body.perm_journal_code_setup,
            perm_salary_mapping: req.body.perm_salary_mapping,
            perm_undo_salary_mapping: req.body.perm_undo_salary_mapping,
            perm_payroll_journal: req.body.perm_payroll_journal,
            perm_application_tracking: req.body.perm_application_tracking,
            perm_supervisor_reassignment: req.body.perm_supervisor_reassignment,
        }
        const userData = await users.findUserByUserId(req.params['user_id']).then((data) => {
            return data;

        })
        if (_.isEmpty(userData) || _.isNull(userData)) {
            return res.status(404).json('User does not exist in database')
        }


      const updateUser =  await users.updateUser(user, req.params['user_id']).then((data) => {
           return data
        })

        if(_.isEmpty(updateUser) || _.isNull(updateUser)){
            return res.status(404).json('An error occurred')
        }

        const permissionData = await permissionService.getPermission(req.params['user_id']).then((data)=>{
            return data
        })

        if(_.isEmpty(permissionData) || _.isNull(permissionData)){
            const addPermission = await permissionService.addPermission(permissionObject).then((data) => {
                return data
            })

        }else{
            const updatePermission = await permissionService.updatePermission(permissionObject).then((data) => {
                return data
            })

        }


        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": "Updated user",
            "log_date": new Date()
        }
        await logs.addLog(logData).then((logRes) => {
            //return res.status(200).json(logRes);
            return res.status(200).json(`User updated`)
        })


    } catch (err) {

        console.error(`Error while updating user `, err.message);
        next(err);
    }
});

/* Login User */
router.post('/login', async function (req, res, next) {

    try {
        const user = req.body

       let checkUserExisting =  await users.findUserByUsername(user.user_username).then((data) => {
           return  data

        })


        if(_.isEmpty(checkUserExisting) || _.isNull(checkUserExisting)){
            return res.status(404).json('Invalid Username')
        }

        if (parseInt(checkUserExisting.user_status) !== 1){
            return res.status(400).json('User Account Suspended')
        }

        bcrypt.compare(user.user_password, checkUserExisting.user_password, async function (err, response) {
            if (err) {
                return res.status(400).json(`${err} occurred while logging in`)
            }
            if (response) {
               checkUserExisting = JSON.parse( JSON.stringify( checkUserExisting ) );

                delete checkUserExisting.user_password;
                let employeeId = {}
                let userData = {}
                let userPermission = [ ]


                const permissionData = await permissionService.getPermission(checkUserExisting.user_id).then((data)=>{
                    return data
                })

                if(!_.isEmpty(permissionData)){

                    if(parseInt(permissionData.perm_manage_user) === 1){
                        userPermission.push('MANAGE_USER')
                    }

                    if(parseInt(permissionData.perm_hr_config) === 1){
                        userPermission.push('HR_CONFIG')
                    }
                    if(parseInt(permissionData.perm_payroll_config) === 1){
                        userPermission.push('PAYROLL_CONFIG')
                    }

                    if(parseInt(permissionData.perm_payment_definition) === 1){
                        userPermission.push('PAYMENT_DEFINITION')
                    }

                    if(parseInt(permissionData.perm_onboard_employee) === 1){
                        userPermission.push('ONBOARD_EMPLOYEE')
                    }

                    if(parseInt(permissionData.perm_manage_employee) === 1){
                        userPermission.push('MANAGE_EMPLOYEE')
                    }

                    if(parseInt(permissionData.perm_assign_supervisors) === 1){
                        userPermission.push('ASSIGN_SUPERVISORS')
                    }

                    if(parseInt(permissionData.perm_announcement) === 1){
                        userPermission.push('ANNOUNCEMENT')
                    }

                    if(parseInt(permissionData.perm_query) === 1){
                        userPermission.push('QUERY')
                    }

                    if(parseInt(permissionData.perm_leave) === 1){
                        userPermission.push('LEAVE')
                    }

                    if(parseInt(permissionData.perm_travel) === 1){
                        userPermission.push('TRAVEL')
                    }

                    if(parseInt(permissionData.perm_timesheet) === 1){
                        userPermission.push('TIMESHEET')
                    }

                    if(parseInt(permissionData.perm_self_assessment) === 1){
                        userPermission.push('SELF_ASSESSMENT')
                    }

                    if(parseInt(permissionData.perm_leave_management) === 1){
                        userPermission.push('LEAVE_MANAGEMENT')
                    }

                    if(parseInt(permissionData.perm_setup_variations) === 1){
                        userPermission.push('SETUP_VARIATIONS')
                    }

                    if(parseInt(permissionData.perm_confirm_variations) === 1){
                        userPermission.push('CONFIRM_VARIATIONS')
                    }

                    if(parseInt(permissionData.perm_approve_variations) === 1){
                        userPermission.push('APPROVE_VARIATIONS')
                    }

                    if(parseInt(permissionData.perm_decline_variations) === 1){
                        userPermission.push('DECLINE_VARIATIONS')
                    }
                    if(parseInt(permissionData.perm_run_payroll) === 1){
                        userPermission.push('RUN_PAYROLL')
                    }

                    if(parseInt(permissionData.perm_undo_payroll) === 1){
                        userPermission.push('UNDO_PAYROLL')
                    }

                    if(parseInt(permissionData.perm_confirm_payroll) === 1){
                        userPermission.push('CONFIRM_PAYROLL')
                    }

                    if(parseInt(permissionData.perm_approve_payroll) === 1){
                        userPermission.push('APPROVE_PAYROLL')
                    }

                    if(parseInt(permissionData.perm_journal_code_setup) === 1){
                        userPermission.push('JOURNAL_CODE_SETUP')
                    }

                    if(parseInt(permissionData.perm_salary_mapping) === 1){
                        userPermission.push('SALARY_MAPPING')
                    }

                    if(parseInt(permissionData.perm_undo_salary_mapping) === 1){
                        userPermission.push('UNDO_SALARY_MAPPING')
                    }

                    if(parseInt(permissionData.perm_payroll_journal) === 1){
                        userPermission.push('PAYROLL_JOURNAL')
                    }

                    if(parseInt(permissionData.perm_application_tracking) === 1){
                        userPermission.push('APPLICATION_TRACKING')
                    }

                    if(parseInt(permissionData.perm_supervisor_reassignment) === 1){
                        userPermission.push('SUPERVISOR_REASSIGNMENT')
                    }

                }

                checkUserExisting.permission = userPermission

                if (parseInt(checkUserExisting.user_type) === 2 || parseInt(checkUserExisting.user_type) === 3) {

                    const employeeData = await employees.getEmployeeById(checkUserExisting.user_username).then((empRes) => {

                    return empRes
                    })
                    employeeId = employeeData

                    let token = generateAccessToken(checkUserExisting)

                    const logData = {
                        "log_user_id": checkUserExisting.user_id,
                        "log_description": "logged in",
                        "log_date": new Date()
                    }

                    logs.addLog(logData).then(async (logRes) => {
                        checkUserExisting.user_password = null;
                        const responseData = {
                            "token": token,
                            "userData": checkUserExisting,
                            "employee": employeeId,
                            "permission": userPermission,
                            "notifications": await notificationModel.getAllEmployeeUnreadNotifications(parseInt(employeeId.emp_id)).then(n => {
                                return n;
                            })
                        }
                        return res.status(200).json(responseData);
                    })


                }

                else {


                    let token = generateAccessToken(checkUserExisting)

                    const logData = {
                        "log_user_id": checkUserExisting.user_id,
                        "log_description": "logged in",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then(async (logRes) => {
                        checkUserExisting.user_password = null;
                        const responseData = {
                            "token": token,
                            "userData": checkUserExisting,
                            "permission": userPermission,
                            "notifications": [],
                        }
                        return res.status(200).json(responseData);
                    })

                }

            }
            else {
                return res.status(400).json('Incorrect Password')
            }
        })


    } catch (err) {
        return res.status(400).json(`Error while logging user ${err.message}`)
    }
});

function generateAccessToken(username) {
    return jwt.sign({username}, process.env.TOKEN_SECRET, {expiresIn: '18000s'});
}


router.post('/change-password', auth, users.changePassword);

/* Login User */
router.post('/forgot-password', async function (req, res, next) {

    try {
        const user = req.body

        let checkUserExisting =  await users.findUserByEmail(user.user_username).then((data) => {
            return data
        })

        if(_.isEmpty(checkUserExisting) || _.isNull(checkUserExisting)){
            return res.status(404).json('Invalid Username')
        }

        if (parseInt(checkUserExisting.user_status) !== 1){
            return res.status(400).json('User Account Suspended')
        }

        let newPassword = generatePassword(10)

        let updatePassword = await users.updateUserPassword(checkUserExisting.user_id, newPassword).then((data) => {
            return data
        })

        let tempEmp = await employee.getEmployeeById(checkUserExisting.user_username).then((data) => {
            return data
        })

        let empJobRole = 'N/A'
        if (parseInt(tempEmp.emp_job_role_id) > 0) {
            empJobRole = tempEmp.jobrole.job_role
        }

        let sectorName = 'N/A'
        if (parseInt(tempEmp.emp_department_id) > 0) {
            sectorName = `${tempEmp.sector.department_name} - ${tempEmp.sector.d_t3_code}`
        }

        const templateParams = {
            name: `${tempEmp.emp_first_name} ${tempEmp.emp_last_name}`,
            department: sectorName,
            jobRole: empJobRole,
            employeeId: checkUserExisting.user_username,
            password: newPassword
        }

        const mailerRes =  await mailer.resetPasswordSendMail('noreply@ircng.org', tempEmp.emp_office_email, 'Password Reset', templateParams).then((data)=>{
            return data
        })

        return res.status(200).json(`Password Reset Successful, Check your email for new password`)


    } catch (err) {
        return res.status(400).json(`Error while logging user ${err.message}`)
    }
});

function generatePassword(length) {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for (let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}



module.exports = router;
