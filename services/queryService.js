const { sequelize, Sequelize } = require('./db');
const queryModel = require("../models/query")(sequelize, Sequelize.DataTypes);
const notificationModel = require("../models/notification")(sequelize, Sequelize.DataTypes);
const employeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const _ = require('lodash');

const helper  =require('../helper');
const mailer = require("./IRCMailer");
const path = require("path");
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
      viewUrl: Joi.string().required(),
    })
    const queryRequest = req.body
    const validationResult = schema.validate(queryRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    const employees = req.body.employee;
    let query = null;
    employees.map(async (employee) => {
      let data = {
        q_queried: parseInt(employee.value),
        q_queried_by: req.body.queried_by,
        q_query_type: req.body.query_type,
        q_body: req.body.body,
        q_subject: req.body.subject,
      }
      query = await queryModel.addQuery(data);
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
          req.body.viewUrl, //"url-goes-here"
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
    return res.status(200).json(query);

  }catch (e) {
    return res.status(400).json(`Something went wrong`+e.message);

  }
}

const uploadQueryFiles = async (req, res)=>{
    try{
      const queryId = req.params.queryId;
      const query = await queryModel.getQueryById(queryId);
      if(_.isNull(query) || _.isEmpty(query)){
        return res.status(400).json("Record does not exist");
      }
      let docs = req.files.documents;
      if (Array.isArray(docs)) {

        let success = [];

        for (const doc of docs) {
          const uploadResponse = await uploadFile(doc).then((response) => {
            return response
          })
          await queryModel.updateQueryAttachmentUrl(queryId, doc.name);
        }

        return res.status(200).json(`Action Successful`)
      }
      else {
        const uploadResponse = await uploadFile(docs).then((response) => {
          return response
        }).catch(err => {
          return res.status(400).json(err)
        })

        await queryModel.updateQueryAttachmentUrl(queryId, uploadResponse);
        return res.status(200).json('Action Successful')
      }
    }catch (e) {
      return res.status(400).json("Something went wrong.");
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

const uploadFile = (fileRequest) => {
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
    console.log({s3})
    await s3.upload(params, function (s3Err, data) {
      console.log({s3Err})
      if (s3Err) {
        reject(s3Err)
      }
      s3Res = data.Location
      resolve(s3Res)
    });
  })

}

module.exports = {
  queryEmployee,
  getAllEmployeeQueries,
  getAllQueries,
  getQuery,
  uploadQueryFiles
}
