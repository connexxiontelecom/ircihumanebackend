const Joi = require('joi');
const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const employee = require("../models/Employee")(sequelize, Sequelize.DataTypes);
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const logs = require('../services/logService')

const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}
const getAllEmployee = async (req, res)=>{
    const employees =  await employee.findAll();
    res.send(employees)
}
const createNewEmployee = async (req, res, next)=>  {
    try{
        const schema = Joi.object( {
            first_name: Joi.string()
                .required()
                .messages({'any.required':'Enter first name in the field provided'}),
            last_name: Joi.string().required().messages({'any.required':'Enter last name in the field provided'}),
            other_name: Joi.string().required().messages({'any.required':'Enter other name in the field provided'}),
            unique_id: Joi.string().required().messages({'any.required':'Enter unique ID in the field provided'}),
            birth_date: Joi.date().required().messages({'any.required':'Enter employee birth date'}),
            personal_email: Joi.string().required().messages({'any.required':'Enter a valid personal email address'}),
            office_email: Joi.string().required().messages({'any.required':'Enter a valid office email address'}),
            phone_no: Joi.string().required().messages({'any.required':'Enter employee phone number'}),
            qualification: Joi.string().required().messages({'any.required':'Enter employee qualification'}),
            address: Joi.string().required().messages({'any.required':'Enter employee residential address'}),
            location: Joi.number().required().messages({'any.required':'Select employee location from the list provided'}),
            subsidiary: Joi.number().required().messages({'any.required':'Which of the subsidiaries does this employee belongs to?'}),
            job_role: Joi.number().required().messages({"any.required":"What's this employee's job role?"}),
            grade_level: Joi.number().required().messages({"any.required":"What's this employee's grade level?"}),
            account_no: Joi.string().required().messages({"any.required":"Enter employee's account number"}),
            bank: Joi.number().required().messages({"any.required":"Choose the bank associated with the account number you entered?"}),
            hmo_no: Joi.string().required().messages({"any.required":"Enter employee's HMO number"}),
            hmo_id: Joi.number().required().messages({"any.required":"What's the HMO associated with the HMO number you entered?"}),
            pensionable: Joi.number().required().messages({"any.required":"Is this employee pensionable?"}),
            pension_no: Joi.string().required().messages({"any.required":"Enter pension number"}),
            pension_id: Joi.number().required().messages({"any.required":"Select the pension body associated with the pension number you entered"}),
            paye_no: Joi.string().required().messages({"any.required":"Enter PAYE number"}),
            passport: Joi.string().required().messages({"any.required":"Enter employee passport"}),
            nysc_details: Joi.string().required().messages({"any.required":"Enter employee NYSC details"}),
            nysc_document: Joi.string().required().messages({"any.required":"Enter employee NYSC document"}),
            state: Joi.number().required().messages({"any.required":"What's employee's state of origin?"}),
            lga: Joi.number().required().messages({"any.required":"What's employee's Local Govt. Area?"}),
            marital_status: Joi.number().required().messages({"any.required":"What's employee's marital status?"}),
            spouse_name: Joi.string().required().messages({"any.required":"Enter employee's spouse name"}),
            spouse_phone_no: Joi.string().required().messages({"any.required":"Enter employee's spouse phone number"}),
            next_of_kin_name: Joi.string().required().messages({"any.required":"Enter employee's next of kin name"}),
            next_of_kin_address: Joi.string().required().messages({"any.required":"Enter employee's next of kin address"}),
            next_of_kin_phone: Joi.string().required().messages({"any.required":"Enter employee's next of kin phone number"}),
            ailments: Joi.string().required().messages({"any.required":"Enter ailment"}),
            blood_group: Joi.string().required().messages({"any.required":"What's employee's blood group?"}),
            genotype: Joi.string().required().messages({"any.required":"What's employee's genotype?"}),
            emergency_name: Joi.string().required().messages({"any.required":"Enter emergency name"}),
            emergency_contact: Joi.string().required().messages({"any.required":"Enter emergency contact"}),
            employment_date: Joi.date().required().messages({"any.required":"Enter date of employment"}),
            employment_status: Joi.number().required().messages({"any.required":"What's the mode of employment?(Probationary,etc) "}),
            salary_structure: Joi.number().required().messages({"any.required":"Select salary structure "}),
            salary_structure_category: Joi.number().required().messages({"any.required":"Select salary structure category"}),
            tax_amount: Joi.date().required().messages({"any.required":"Enter tax amount"}),
        })
        const employeeRequest = req.body
        const validationResult = schema.validate(employeeRequest, {abortEarly:false});
        if(validationResult.error){
            return res.status(400).json(validationResult.error.details)
        }
        await employee.create({
            emp_first_name: req.body.first_name,
            emp_last_name:req.body.last_name,
            emp_other_name:req.body.other_name,
            emp_unique_id:req.body.unique_id,
            emp_dob:req.body.birth_date,
            emp_personal_email:req.body.personal_email,
            emp_office_email:req.body.office_email,
            emp_phone_no:req.body.phone_no,
            emp_qualification:req.body.qualification,
            //emp_:req.body.address,
            emp_location_id:req.body.location,
            emp_subsidiary_id:req.body.subsidiary,
            emp_job_role_id:req.body.job_role,
            emp_grade_id:req.body.grade_level,
            emp_account_no:req.body.account_no,
            emp_bank_id:req.body.bank,
            emp_hmo_no:req.body.hmo_no,
            emp_hmo_id:req.body.hmo_id,
            emp_pensionable:req.body.pensionable,
            emp_pension_no:req.body.pension_no,
            emp_pension_id:req.body.pension_id,
            emp_paye_no:req.body.paye_no,
            emp_passport:req.body.passport,
            emp_nysc_details:req.body.nysc_details,
            emp_nysc_document:req.body.nysc_document,
            emp_state_id:req.body.state,
            emp_lga_id:req.body.lga,
            emp_marital_status:req.body.marital_status,
            emp_spouse_name:req.body.spouse_name,
            emp_spouse_phone_no:req.body.spouse_phone_no,
            emp_next_of_kin_name:req.body.next_of_kin_name,
            emp_next_of_kin_address:req.body.next_of_kin_address,
            emp_next_of_kin_phone_no:req.body.next_of_kin_phone,
            emp_ailments:req.body.ailments,
            emp_blood_group:req.body.blood_group,
            emp_genotype:req.body.genotype,
            emp_emergency_name:req.body.emergency_name,
            emp_emergency_contact:req.body.emergency_contact,
            emp_employment_date:req.body.employment_date,
            emp_status:req.body.employment_status,
            emp_salary_structure_setup:req.body.salary_structure,
            emp_salary_structure_category:req.body.salary_structure_category,
            emp_tax_amount:req.body.tax_amount,
        }).catch(errHandler);

        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on employee enrollment: Added a new employee(${req.body.first_name} ${req.body.last_name})`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes)=>{
            return res.status(201).json(`New employee(${req.body.first_name}) enrollment was done successfully.`);
        })
    }catch (e) {
        console.error(`Error: Could not enrol employee `, e.message);
        next(e);
    }
}
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
    //updateDepartment,
    //setNewDepartment,
}