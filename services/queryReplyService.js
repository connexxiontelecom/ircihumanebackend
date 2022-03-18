const { sequelize, Sequelize } = require('./db');
const queryReplyModel = require("../models/queryreply")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const _ = require('lodash');

const helper  =require('../helper');
const errHandler = (err) =>{
  console.log("Error: ", err);
}
const replyQuery = async (req, res)=>  {
  try{
    const schema = Joi.object( {
      employee: Joi.number().required(),
      reply: Joi.string().required(),
      query_id: Joi.number().required(),
      reply_source: Joi.number().required()
    })
    const queryReplyRequest = req.body
    const validationResult = schema.validate(queryReplyRequest)

    if(validationResult.error){
      return res.status(400).json(validationResult.error.details[0].message)
    }
    let data = {
      qr_reply : req.body.reply,
      qr_emp_id : parseInt(req.body.employee),
      qr_reply_source : parseInt(req.body.reply_source),
      qr_query_id: parseInt(req.body.query_id)
    }
    const query =  queryReplyModel.postReply(data);
    if(!(_.isEmpty(query)) || !(_.isNull(query))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Log on query reply module`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(`Your response was recorded`);
      })
    }


  }catch (e) {
    return res.status(400).json(`Something went wrong. ${e.message}`);

  }
}
const getAllRepliesByQueryId = async (req, res) =>{
  const queryId  = req.params.id;
  try{
    const replies =  await queryReplyModel.getAllQueryRepliesByQueryId(queryId);
    const data = {
      replies
    }
    return res.status(200).json(data);
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again later.");
  }
}

module.exports = {
  getAllRepliesByQueryId,
  replyQuery,
}
