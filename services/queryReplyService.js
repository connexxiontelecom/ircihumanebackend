const { sequelize, Sequelize } = require('./db');
const queryReplyModel = require("../models/queryreply")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const _ = require('lodash');

const helper  =require('../helper');
const path = require("path");
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
});

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
    const query =  await queryReplyModel.postReply(data);
    if(!(_.isEmpty(query)) || !(_.isNull(query))){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Log on query reply module`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes)=>{
        return res.status(200).json(query);
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

const uploadQueryReplyFiles = async (req, res)=>{
  try{
    const replyId = parseInt(req.params.replyId);
    const reply = await queryReplyModel.getAllQueryReplyByReplyId(replyId);
    if(_.isNull(reply) || _.isEmpty(reply)){
      return res.status(400).json("Record does not exist");
    }
    let docs = req.files.documents;
    if (Array.isArray(docs)) {

      let success = [];

      for (const doc of docs) {
        const uploadResponse = await uploadFile(doc).then((response) => {
          return response
        })
        await queryReplyModel.updateQueryReplyAttachmentUrl(replyId, uploadResponse);
      }

      return res.status(200).json(`Action Successful`)
    }
    else {
      const uploadResponse = await uploadFile(docs).then((response) => {
        return response
      }).catch(err => {
        return res.status(400).json(err)
      })

      await queryReplyModel.updateQueryReplyAttachmentUrl(replyId, uploadResponse);
      return res.status(200).json('Action Successful')
    }
  }catch (e) {
    return res.status(400).json("Something went wrong."+e.message);
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
    //console.log({s3})
    await s3.upload(params, function (s3Err, data) {
      //console.log({s3Err})
      if (s3Err) {
        reject(s3Err)
      }
      s3Res = data.Location
      resolve(s3Res)
    });
  })

}
module.exports = {
  getAllRepliesByQueryId,
  replyQuery,
  uploadQueryReplyFiles,
}
