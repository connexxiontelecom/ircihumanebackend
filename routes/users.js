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


/* Get All Users */
router.get('/', auth(), async function (req, res, next) {
    try {

        await users.findAllUsers().then((data) => {
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while fetching users ${err.message}`)
    }
});


/* Add User */
router.post('/add-user', auth, async function (req, res, next) {
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
            perm_approve_payroll: Joi.number().required()
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
                perm_approve_payroll: req.body.perm_approve_payroll
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
                logs.addLog(logData).then((logRes) => {
                    return res.status(200).json(addUser)
                })
            }

            const deleteUser = await users.deleteUser(addUser.user_id).then((data) => {
                return data
            })

            const deletePermission = await permissionService.deletePermission(addUser.user_id).then((data)=>{
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
router.patch('/update-user/:user_id', auth, async function (req, res, next) {
    try {

        const schemaWithoutPassword = Joi.object({
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
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
        })

        const user = req.body

        let validationResult;
        if (user.user_password) {
            validationResult = schemaWithPassword.validate(user)
        } else {
            validationResult = schemaWithoutPassword.validate(user)
        }

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }


        await users.findUserByUserId(req.params['user_id']).then((data) => {
            if (data) {
                users.updateUser(user, req.params['user_id']).then((data) => {
                    const logData = {
                        "log_user_id": req.user.username.user_id,
                        "log_description": "Added new user",
                        "log_date": new Date()
                    }
                    logs.addLog(logData).then((logRes) => {
                        //return res.status(200).json(logRes);
                        return res.status(200).json(`User updated`)
                    })

                })


            } else {
                return res.status(404).json('User does not exist in database')
            }
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
        await users.findUserByUsername(user.user_username).then((data) => {
            if (data) {
                if (parseInt(data.user_status) === 1) {
                    bcrypt.compare(user.user_password, data.user_password, function (err, response) {
                        if (err) {
                            return res.status(400).json(`${err} occurred while logging in`)
                        }
                        if (response) {
                            delete data.user_password;
                            let employeeId = {}
                            let userData = {}
                            userData = data

                            if (parseInt(data.user_type) === 2 || parseInt(data.user_type) === 3) {

                                employees.getEmployeeById(data.user_username).then((empRes) => {
                                    employeeId = empRes

                                    let token = generateAccessToken(data)

                                    const logData = {
                                        "log_user_id": data.user_id,
                                        "log_description": "logged in",
                                        "log_date": new Date()
                                    }

                                    logs.addLog(logData).then(async (logRes) => {
                                        data.user_password = null;
                                        const responseData = {
                                            "token": token,
                                            "userData": userData,
                                            "employee": employeeId,
                                            "notifications": await notificationModel.getAllEmployeeUnreadNotifications(parseInt(employeeId.emp_id)).then(n => {
                                                return n;
                                            })
                                        }
                                        return res.status(200).json(responseData);
                                    })


                                })

                            } else {

                                let token = generateAccessToken(data)

                                const logData = {
                                    "log_user_id": data.user_id,
                                    "log_description": "logged in",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then(async (logRes) => {
                                    data.user_password = null;
                                    const responseData = {
                                        "token": token,
                                        "userData": userData,
                                        "notifications": [],
                                    }
                                    return res.status(200).json(responseData);
                                })

                            }

                        } else {
                            return res.status(400).json('Incorrect Password')
                        }
                    })
                } else {
                    return res.status(400).json('User Account Suspended')
                }

            } else {
                return res.status(404).json('Invalid Username')
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


module.exports = router;
