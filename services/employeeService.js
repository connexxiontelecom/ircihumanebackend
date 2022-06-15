const Joi = require('joi');
const {QueryTypes, Op, where} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const JobRole = require("../models/JobRole")(sequelize, Sequelize.DataTypes)
const userModel = require("../models/user")(sequelize, Sequelize.DataTypes)
const Department = require("../models/Department")(sequelize, Sequelize.DataTypes)
const locationModel = require("../models/Location")(sequelize, Sequelize.DataTypes)
const operationalUnitModel = require("../models/operationunit")(sequelize, Sequelize.DataTypes)
const reportingEntityModel = require("../models/reportingentity")(sequelize, Sequelize.DataTypes)
const functionalAreaModel = require("../models/functionalarea")(sequelize, Sequelize.DataTypes)
const _ = require('lodash')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const logs = require('../services/logService')
const users = require('../services/userService')
const IRCMailerService = require('../services/IRCMailer');
const uuid = require("uuid");

const helper = require('../helper');
const errHandler = (err) => {
    console.log("Error: ", err);
}
const getAllEmployee = async (req, res) => {
    try {
        const employees = await employee.findAll({
            include: ['supervisor', 'location', 'jobrole', 'sector']
        });
        return res.status(200).json(employees)
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }

}
const createNewEmployee = async (req, res, next) => {
  const text = uuid.v4();
  const password = text.substr(24,12);
    try {
        const schema = Joi.object({
            first_name: Joi.string()
                .required()
                .messages({'any.required': 'Enter first name in the field provided'}),
            last_name: Joi.string().required().messages({'any.required': 'Enter last name in the field provided'}),
            //other_name: Joi.string(),
            unique_id: Joi.string().required().messages({'any.required': 'Enter unique ID in the field provided'}),
            personal_email: Joi.string().allow(null, ''),
            office_email: Joi.string().allow(null, ''),
            emp_d4: Joi.number().allow(null, ''),
            emp_d7: Joi.string().allow(null, ''),
            emp_d5: Joi.number().allow(null, ''),
            emp_d6: Joi.number().allow(null, ''),
            // birth_date: Joi.date().required().messages({'any.required':'Enter employee birth date'}),
            //personal_email: Joi.string().required().messages({'any.required': 'Enter a valid personal email address'}),
            //office_email: Joi.string().required().messages({'any.required': 'Enter a valid office email address'}),
            phone_no: Joi.string().required().messages({'any.required': 'Enter employee phone number'}),
            // qualification: Joi.string().required().messages({'any.required':'Enter employee qualification'}),
            // address: Joi.string().required().messages({'any.required':'Enter employee residential address'}),
            location: Joi.number().required().messages({'any.required': 'Select employee location from the list provided'}),
            //subsidiary: Joi.number().required().messages({'any.required':'Which of the subsidiaries does this employee belongs to?'}),
            job_role: Joi.number().required().messages({"any.required": "What's this employee's job role?"}),
            //department: Joi.number().required().messages({"any.required": "What's this employee's Sector?"}),
            //grade_level: Joi.number().required().messages({"any.required":"What's this employee's grade level?"}),
            account_no: Joi.string().required().messages({"any.required": "Enter employee's account number"}),
            bank: Joi.number().required().messages({"any.required": "Choose the bank associated with the account number you entered?"}),
            //other_name:Joi.string().allow(null,''),
            other_name: Joi.string().allow(null, ''),
            // hmo_no: Joi.string().required().messages({"any.required":"Enter employee's HMO number"}),
            // hmo_id: Joi.number().required().messages({"any.required":"What's the HMO associated with the HMO number you entered?"}),
            // pensionable: Joi.number().required().messages({"any.required":"Is this employee pensionable?"}),
            // pension_no: Joi.string().required().messages({"any.required":"Enter pension number"}),
            // pension_id: Joi.number().required().messages({"any.required":"Select the pension body associated with the pension number you entered"}),
            // paye_no: Joi.string().required().messages({"any.required":"Enter PAYE number"}),
            // passport: Joi.string().required().messages({"any.required":"Enter employee passport"}),
            // nysc_details: Joi.string().required().messages({"any.required":"Enter employee NYSC details"}),
            // nysc_document: Joi.string().required().messages({"any.required":"Enter employee NYSC document"}),
            // state: Joi.number().required().messages({"any.required":"What's employee's state of origin?"}),
            // lga: Joi.number().required().messages({"any.required":"What's employee's Local Govt. Area?"}),
            // marital_status: Joi.number().required().messages({"any.required":"What's employee's marital status?"}),
            // spouse_name: Joi.string().required().messages({"any.required":"Enter employee's spouse name"}),
            // spouse_phone_no: Joi.string().required().messages({"any.required":"Enter employee's spouse phone number"}),
            // next_of_kin_name: Joi.string().required().messages({"any.required":"Enter employee's next of kin name"}),
            // next_of_kin_address: Joi.string().required().messages({"any.required":"Enter employee's next of kin address"}),
            // next_of_kin_phone: Joi.string().required().messages({"any.required":"Enter employee's next of kin phone number"}),
            // ailments: Joi.string().required().messages({"any.required":"Enter ailment"}),
            // blood_group: Joi.string().required().messages({"any.required":"What's employee's blood group?"}),
            // genotype: Joi.string().required().messages({"any.required":"What's employee's genotype?"}),
            // emergency_name: Joi.string().required().messages({"any.required":"Enter emergency name"}),
            // emergency_contact: Joi.string().required().messages({"any.required":"Enter emergency contact"}),
            // employment_date: Joi.date().required().messages({"any.required":"Enter date of employment"}),
            // employment_status: Joi.number().required().messages({"any.required":"What's the mode of employment?(Probationary,etc) "}),
            // salary_structure: Joi.number().required().messages({"any.required":"Select salary structure "}),
            // salary_structure_category: Joi.number().required().messages({"any.required":"Select salary structure category"}),
            // tax_amount: Joi.date().required().messages({"any.required":"Enter tax amount"}),
            emp_status: 1
        })
        const employeeRequest = req.body
        const validationResult = schema.validate(employeeRequest, {abortEarly: false});


        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }


        await getEmployeeById(req.body.unique_id).then((employeeData) => {
            if (!_.isNull(employeeData)) {
                return res.status(400).json("Employee Id Already Exists")
            } else {

                //getEmployeeByPersonalEmail(req.body.personal_email).then((employeeData) => {
                    //if (!_.isNull(employeeData)) {
                       // return res.status(400).json("Employee Personal Email Already Exists")
                   // } else {
                        //getEmployeeByOfficialEmail(req.body.office_email).then((employeeData) => {
                            //if (!_.isNull(employeeData)) {
                                //return res.status(400).json("Employee Official Email Already Exists")
                           // } else {
                                getEmployeeByPhoneNumber(req.body.phone_no).then((employeeData) => {
                                    if (!_.isNull(employeeData)) {
                                        return res.status(400).json("Employee Phone Number Already Exists")
                                    } else {
                                        employee.create({
                                            emp_first_name: req.body.first_name,
                                            emp_last_name: req.body.last_name,
                                            emp_other_name: req.body.other_name,
                                            emp_unique_id: req.body.unique_id,
                                            emp_personal_email: req.body.personal_email,
                                            emp_office_email: req.body.office_email,
                                            emp_phone_no: req.body.phone_no,
                                            emp_location_id: req.body.location,
                                            emp_job_role_id: req.body.job_role,
                                            //emp_department_id: req.body.department,
                                            emp_account_no: req.body.account_no,
                                            emp_bank_id: req.body.bank,
                                            emp_salary_structure_setup: 0,
                                            emp_d4: req.body.emp_d4,
                                            emp_d5: req.body.emp_d5,
                                            emp_d6: req.body.emp_d6,
                                            emp_d7: req.body.emp_d7,
                                            emp_passport: 'https://irc-ihumane.s3.us-east-2.amazonaws.com/placeholder.svg'
                                        }).catch(errHandler);

                                        const userData = {
                                            user_username: req.body.unique_id,
                                            user_name: `${req.body.first_name} ${req.body.first_name}`,
                                            user_email: req.body.office_email,
                                            user_password: password,//'password1234',
                                            user_type: 2,
                                            user_token: 1,
                                            user_status: 1,
                                        }
                                        //users.findUserByEmail(req.body.office_email).then((data) => {
                                            /*if (data) {
                                                employee.destroy({
                                                    where: {
                                                        emp_unique_id: req.body.unique_id,
                                                    }
                                                })
                                                return res.status(400).json('Email Already taken')
*/
                                            //} else {
                                                users.findUserByUsername(req.body.unique_id).then((data) => {
                                                    if (data) {
                                                        employee.destroy({
                                                            where: {
                                                                emp_unique_id: req.body.unique_id,
                                                            }
                                                        })
                                                        return res.status(400).json('Username Already taken')

                                                    } else {
                                                        users.addUser(userData).then((data) => {
                                                            const logData = {
                                                                "log_user_id": req.user.username.user_id,
                                                                "log_description": `Log on employee enrollment: Added a new employee(${req.body.first_name} ${req.body.last_name})`,
                                                                "log_date": new Date()
                                                            }
                                                            logs.addLog(logData).then((logRes) => {
                                                                return res.status(201).json(`New employee(${req.body.first_name}) enrollment was done successfully.`);
                                                            })
                                                        })
                                                      //send mail
                                                      //signature: from, to, subject, text
                                                      const message = `Here's your login credentials \n Email: ${req.body.office_email} \n Password: ${password} \n Do well to login to change this system generated password to something you can remember.`;
                                                      IRCMailerService.sendMail("no-reply@irc.org",req.body.office_email, "Login credentials",  message)
                                                    }
                                                })
                                            //}
                                        //})
                                    }
                                })
                           // }

                       // })
                    //}
                //})

            }
        })

    } catch (e) {
        console.error(`Error: Could not enrol employee `, e.message);
        next(e);
    }
}

async function getEmployee(employeeId) {
    return await employee.findOne({
        where: {emp_id: employeeId},
        include: [ 'location',
          'jobrole', 'sector', 'bank',
          'lga', 'state', 'pension','operationUnit',
          'reportingEntity', 'functionalArea',
          {model:employee, as: 'supervisor',
            include: [
              {model:Department, as:'sector'},
              {model: locationModel, as:'location'},
            ]
          },
        ]
    })
}

async function getEmployees() {
    return await employee.findAll({
        include: ['supervisor', 'location', 'bank', 'jobrole', 'sector', 'functionalArea', 'reportingEntity', 'operationUnit', 'pension']
    })
}

async function setSupervisorStatus(data) {
    return await employee.update({
        emp_supervisor_status: data.emp_supervisor_status,
    }, {
        where: {
            emp_id: data.emp_id
        }
    })
}

async function setSupervisor(employeeId, supervisorId) {
    return await employee.update({
        emp_supervisor_id: supervisorId,
    }, {
        where: {
            emp_id: employeeId
        }
    })
}

async function updateEmployee(employeeId, employeeData) {
    return await employee.update({
        emp_first_name: employeeData.emp_first_name,
        emp_last_name: employeeData.emp_last_name,
        emp_other_name: employeeData.emp_other_name,
        emp_qualification: employeeData.emp_qualification,
        emp_phone_no: employeeData.emp_phone_no,
        emp_account_no: employeeData.emp_account_no,
        emp_bank_id: employeeData.emp_bank_id,
        emp_state_id: employeeData.emp_state_id,
        emp_lga_id: employeeData.emp_lga_id,
        emp_marital_status: employeeData.emp_marital_status,
        emp_spouse_name: employeeData.emp_spouse_name,
        emp_spouse_phone_no: employeeData.emp_spouse_phone_no,
        emp_next_of_kin_name: employeeData.emp_next_of_kin_name,
        emp_next_of_kin_address: employeeData.emp_next_of_kin_address,
        emp_next_of_kin_phone_no: employeeData.emp_next_of_kin_phone_no,
        emp_ailments: employeeData.emp_ailments,
        emp_blood_group: employeeData.emp_blood_group,
        emp_genotype: employeeData.emp_genotype,
        emp_emergency_name: employeeData.emp_emergency_name,
        emp_emergency_contact: employeeData.emp_emergency_contact,
        //emp_contract_end_date:employeeData.emp_contract_end_date,
        //emp_hire_date:employeeData.emp_hire_date,
    }, {
        where: {
            emp_id: employeeId
        }
    })

}

async function updateEmployeeFromBackoffice(employeeId, employeeData) {
    return await employee.update({
        emp_first_name: employeeData.emp_first_name,
        emp_last_name: employeeData.emp_last_name,
        emp_other_name: employeeData.emp_other_name,
        emp_personal_email: employeeData.emp_personal_email,
        emp_office_email: employeeData.emp_office_email,
        emp_qualification: employeeData.emp_qualification,
        emp_phone_no: employeeData.emp_phone_no,
        emp_account_no: employeeData.emp_account_no,
        emp_bank_id: employeeData.emp_bank_id,
        emp_state_id: employeeData.emp_state_id,
        emp_lga_id: employeeData.emp_lga_id,

        emp_spouse_name: employeeData.emp_spouse_name,
        emp_spouse_phone_no: employeeData.emp_spouse_phone_no,
        emp_next_of_kin_name: employeeData.emp_next_of_kin_name,
        emp_next_of_kin_address: employeeData.emp_next_of_kin_address,
        emp_next_of_kin_phone_no: employeeData.emp_next_of_kin_phone_no,
        emp_ailments: employeeData.emp_ailments,
        emp_blood_group: employeeData.emp_blood_group,
        emp_genotype: employeeData.emp_genotype,
        emp_emergency_name: employeeData.emp_emergency_name,
        emp_emergency_contact: employeeData.emp_emergency_contact,
        emp_contract_end_date: employeeData.emp_contract_end_date,
        emp_hire_date: employeeData.emp_hire_date,
        emp_dob: employeeData.emp_dob,
        emp_job_role_id: employeeData.emp_job_role_id,
        emp_department_id: employeeData.emp_department_id,
        emp_sex: employeeData.emp_sex,
        emp_religion: employeeData.emp_religion,
        emp_location_id: employeeData.emp_location_id,
        //emp_bvn: employeeData.emp_bvn,
        //emp_nhf: employeeData.emp_nhf,
        emp_paye_no: employeeData.emp_paye_no, //employeeData.emp_paye_no,
        emp_marital_status: employeeData.emp_marital_status,
        emp_pension_no: employeeData.emp_pension_no,
        emp_pensionable: employeeData.emp_pension,
        emp_bvn: employeeData.emp_bvn,
        emp_pension_id: employeeData.emp_pension_id,
        emp_nhf: employeeData.emp_nhf,
        emp_nin: employeeData.emp_nin,
        emp_d4: employeeData.emp_d4,
        emp_d5: employeeData.emp_d5,
        emp_d6: employeeData.emp_d6,
        emp_d7: employeeData.emp_d7,
        //emp_nin: employeeData.emp_sector,
    }, {
        where: {
            emp_id: employeeId
        }
    })

}


async function updateGrossSalary(employeeId, employeeGross) {
    return await employee.update({
        emp_gross: employeeGross
    }, {
        where: {
            emp_id: employeeId
        }
    })

}

async function getEmployeeById(employeeId) {
    return await employee.findOne({
        where: {emp_unique_id: employeeId},
        include: ['supervisor', 'location', 'pension', 'bank', 'jobrole', 'sector', 'functionalArea', 'reportingEntity', 'operationUnit']
    })
}

async function getEmployeeByIdOnly(employeeId) {
    return await employee.findOne({
        where: {emp_id: employeeId},
        include: ['supervisor', 'location', 'pension', 'bank', 'jobrole', 'sector', 'functionalArea', 'reportingEntity', 'operationUnit']
    })
}

async function getEmployeeList(empIds) {
    return await employee.findAll({
        where: {emp_id: empIds},
        // include: ['supervisor', 'location', {model: JobRole, include: Department}]
    })
}

async function getEmployeeByPersonalEmail(employeePEmail) {
    return await employee.findOne({where: {emp_personal_email: employeePEmail}})
}

async function getEmployeeByOfficialEmail(employeeOEmail) {
    return await employee.findOne({where: {emp_office_email: employeeOEmail}})
}

async function getEmployeeByPhoneNumber(employeePhoneNumber) {
    return await employee.findOne({where: {emp_phone_no: employeePhoneNumber}})
}

async function getSupervisors() {
    return await employee.findAll({where: {emp_supervisor_status: 1}})
}

async function getNoneSupervisors() {
    return await employee.findAll({
            where:
                {
                    emp_supervisor_status: {
                        [Op.or]: [0, null]
                    }
                }

        }
    )
}

async function getSupervisorEmployee(supervisorId) {
    return await employee.findAll({where: {emp_supervisor_id: supervisorId}})
}

async function getActiveEmployees() {
    return await employee.findAll({
        where: {
            emp_status: 1
        },
        include: ['supervisor', 'location', 'pension', 'bank', 'jobrole', 'sector', 'functionalArea', 'reportingEntity', 'operationUnit']
    })
}

async function updateProfilePicture(employeeId, employeeData) {
    return await employee.update({
        emp_passport: employeeData.emp_passport
    }, {
        where: {
            emp_id: employeeId
        }
    })

}

async function suspendEmployee(employeeId, suspensionReason) {
    return await employee.update({
        emp_status: 0,
        emp_suspension_reason: suspensionReason
    }, {
        where: {
            emp_id: employeeId
        }
    })

}



async function getActiveEmployeesByLocation(locationId) {
    return await employee.findAll({
            where: {
                emp_location_id: locationId,
                emp_status: [1, 2]
            },
            include: ['supervisor', 'location', 'pension', 'bank', 'jobrole', 'sector', 'functionalArea', 'reportingEntity', 'operationUnit']
        }
    )

}

async function getAllEmployeesByLocation(locationId) {
    return await employee.findAll({
            where: {
                emp_location_id: locationId,
            },
            include: ['supervisor', 'location', 'pension', 'bank', 'jobrole', 'sector', 'pension']
        }
    )

}

async function unSuspendEmployee(employeeId) {
    return await employee.update({
        emp_status: 1,
    }, {
        where: {
            emp_id: employeeId
        }
    })

}

async function changePassword(req, res) {
    try {
        const schema = Joi.object({
            current_password: Joi.string().required(),
            new_password: Joi.string().required(),
            confirm_password: Joi.string().required(),
            userId: Joi.number().required(),
        })
        const passwordRequest = req.body
        const validationResult = schema.validate(passwordRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const {current_password, new_password, confirm_password, userId} = req.body;
        if (new_password !== confirm_password) return res.status(400).json("Password confirmation mis-match.");
        const user = await userModel.geUserById(userId);

        if (!user) return res.status(400).json("User does not exist.");

        bcrypt.compare(current_password, user.user_password, function (err, response) {
            if (err) {
                return res.status(400).json(`${err} occurred while logging in`)
            }

            if (response) {
                const hashedPassword = bcrypt.hashSync(new_password, 10);
                const userDetail = userModel.update({
                    user_password: hashedPassword
                }, {
                    where: {user_id: userId}
                });
                const logData = {
                  "log_user_id": req.user.username.user_id,
                  "log_description": "Changed password",
                  "log_date": new Date()
                }
                logs.addLog(logData).then((logRes) => {

                  return res.status(200).json('Password changed successfully.')
                })

                return res.status(200).json(user);
            } else {
                return res.status(400).json('Incorrect Password')
            }
        })

        /*await bcrypt.compare( current_password,user.user_password,(err, response)=>{
          return res.status(200).json('hello');
          if(err) return res.status(400).json("The password you entered does not match our record. Try again.");

          if(response){
            return res.status(200).json("here");
            const hashedPassword =  bcrypt.hashSync(new_password, 10);
            const userDetail = userModel.update({
              user_password: hashedPassword
            },{
              where:{user_id: userId}
            });
            return res.status(200).json(userDetail);
          }

        });*/
    } catch (e) {
        return res.status(400).json("Something went wrong.");
    }


}

async function getInactiveEmployees() {
    return await employee.findAll({
            where:
                {
                    emp_status: {
                        [Op.or]: [0, 2, null]
                    }
                },
        include: ['supervisor', 'location', 'pension', 'bank', 'jobrole', 'sector']

        }
    )
}

async function getEmployeesByPfaLocation(pfaId, locationId) {
    return await employee.findAll({where:{
            emp_pension_id: pfaId,
            emp_location_id: locationId

    }
    })
}


// const getEmployeeById = async (req, res) =>{
//     const department_id  = req.params.id;
//     const depart =  await department.findAll({where:{department_id: department_id}});
//     res.send(depart);
// }
/*
const getDepartmentById = async (req, res) =>{
    const department_id  = req.params.id;
    const depart =  await department.findAll({where:{department_id: department_id}});
    res.send(depart);
}
const updateDepartment = async (req, res, next)=>{
    try{
        const schema = Joi.object( {
            department_name: Joi.string().required(),
            t3_code: Joi.string().required(),
        })
        const departmentRequest = req.body
        const validationResult = schema.validate(departmentRequest)

        if(validationResult.error){
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const department_id = req.params.id;
        const depart = await department.update({
            department_name: req.body.department_name,
            d_t3_code:req.body.t3_code
        },{
            where:{
                department_id:department_id
            }
        });
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on department: Made changes on (${req.body.department_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(200).json(`Your changes on   ${req.body.department_name} were saved successfully.`);
        });
    }catch (e) {
        console.error(`Error while adding payment definition `, e.message);
        next(e);
    }
}
*/

module.exports = {
    createNewEmployee,
    getAllEmployee,
    setSupervisor,
    setSupervisorStatus,
    getEmployeeById,
    getEmployee,
    getEmployeeByOfficialEmail,
    getEmployeeByPersonalEmail,
    getSupervisors,
    getNoneSupervisors,
    getSupervisorEmployee,
    updateEmployee,
    updateEmployeeFromBackoffice,
    updateGrossSalary,
    getActiveEmployees,
    getEmployeeByIdOnly,
    getEmployeeList,
    updateProfilePicture,
    suspendEmployee,
    unSuspendEmployee,
    getActiveEmployeesByLocation,
    changePassword,
    getEmployees,
    getInactiveEmployees,
    unSuspendEmployee,
    getAllEmployeesByLocation,
    getEmployeesByPfaLocation
    //updateDepartment,
    //setNewDepartment,
}
