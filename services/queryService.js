const { sequelize, Sequelize } = require('./db');
const queryModel = require("../models/query")(sequelize, Sequelize.DataTypes);
const notificationModel = require("../models/notification")(sequelize, Sequelize.DataTypes);
const employeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const _ = require('lodash');

const helper  =require('../helper');
const mailer = require("./IRCMailer");
const errHandler = (err) =>{
  console.log("Error: ", err);
}
const queryEmployee = async (req, res)=>  {
  try{
    const schema = Joi.object( {
      employee: Joi.array().required(),
      subject: Joi.string().required(),
      body: Joi.string().required(),
      query_type: Joi.number().required(),
      queried_by: Joi.number().required(),
    })
    const queryRequest = req.body
    const validationResult = schema.validate(queryRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const employees = req.body.employee;
    employees.map(async (employee) => {
      let data = {
        q_queried: parseInt(employee.value),
        q_queried_by: req.body.queried_by,
        q_query_type: req.body.query_type,
        q_body: req.body.body,
        q_subject: req.body.subject,
      }
      let query = await queryModel.addQuery(data);
      if (!(_.isEmpty(query)) || !(_.isNull(query))) {

        const empUser = await employeeModel.getEmployeeById(employee.value);
        const templateParams = {
          firstName: `${empUser.emp_first_name}`,
          title: `${req.body.title}`,
        }

        const mailerRes = await mailer.sendAnnouncementNotification('noreply@ircng.org', empUser.emp_office_email, 'New Query', templateParams).then((data) => {
          return data
        })

        //notification
        const notifyEmp = notificationModel.registerNotification(
          req.body.subject.substring(0, 20),
          req.body.body.replace(/(<([^>]+)>)/ig, '').substring(0, 46),
          employee.value,
          query.q_id,
          "url-goes-here"
        )
        //Log
        const logData = {
          "log_user_id": req.user.username.user_id,
          "log_description": `Log on query module`,
          "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {

        })
      }
    });
    return res.status(200).json(`Query recorded.`);

  }catch (e) {
    return res.status(400).json(`Something went wrong. ${e.message}`);

  }
}
const getAllEmployeeQueries = async (req, res) =>{
  const empId  = req.params.id;
  try{
    const list =  await queryModel.getAllQueriesByEmployeeId(empId);
    const data = {
      list
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}
const getAllQueries = async (req, res) =>{
  try{
    const list =  await queryModel.getAllQueries();
    const data = {
      list
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}

const getQuery = async (req, res) =>{
  const queryId = req.params.id;
  try{
    const query =  await queryModel.getQueryById(queryId);
    const data = {
      query
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}

module.exports = {
  queryEmployee,
  getAllEmployeeQueries,
  getAllQueries,
  getQuery
}
