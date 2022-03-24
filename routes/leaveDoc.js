const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const {sequelize, Sequelize} = require('../services/db');
const leaveDocModel = require('../models/leaveappdocument')(sequelize, Sequelize.DataTypes);
const leaveService = require('../services/leaveApplicationService');
const _ = require('lodash')
//const documents = require("../services/employeeDocumentsService");
const path = require("path");
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: process.env.ACCESS_KEY,
  secretAccessKey: process.env.SECRET_KEY
});
/* GET leave doc . */

router.post('/leave-doc/:leaveId', auth, async (req, res)=>{
  try{
    const leaveId = req.params.leaveId;
    const leave = await leaveService.getLeaveApplicationsById(leaveId);
    if(_.isNull(leave) || _.isEmpty(leave)){
      return res.status(400).json("Record does not exist");
    }
    let docs = req.files.documents;
    //return res.status(200).json(docs.name);


    if (Array.isArray(docs)) {

      let success = [];

      for (const doc of docs) {
        const uploadResponse = await uploadFile(doc).then((response) => {
          return response
        })
        /*if (_.isEmpty(uploadResponse) || _.isNull(uploadResponse)) {
          if (!(_.isEmpty(success) || _.isNull(success))) {
            for (const failure of success) {
              let removeResponse = documents.deleteEmployeeDocument(failure).then((data) => {
                return data
              })
            }
            return res.status(400).json(`An error occurred while uploading documents`)
          }
          return res.status(400).json(`An error occurred while uploading documents`)
        }*/
        const documentData = {
          leavedoc_leave_id: leaveId,
          leavedoc_url: uploadResponse,
          leavedoc_filename: doc.name
        }
        let documentAddResponse = await leaveDocModel.saveLeaveSupportingDocuments(documentData).then((data) => {
          return data
        })
        if (_.isEmpty(documentAddResponse) || _.isNull(documentAddResponse)) {
        /*  if (!(_.isEmpty(success) || _.isNull(success))) {
            for (const failure of success) {
              let removeResponse = documents.deleteEmployeeDocument(failure).then((data) => {
                return data
              })
            }
            return res.status(400).json(`An error occurred while uploading documents`)
          }*/

          return res.status(400).json(`An error occurred while uploading documents`)
        }
        success.push(uploadResponse)
      }

      return res.status(200).json(`Action Successful`)
    }
    else {
      const uploadResponse = await uploadFile(docs).then((response) => {
        return response
      }).catch(err => {
        return res.status(400).json(err)
      })

      const documentData = {
        leavedoc_leave_id: leaveId,
        leavedoc_url: uploadResponse,
        leavedoc_filename: docs.name
      }

      let documentAddResponse = await leaveDocModel.saveLeaveSupportingDocuments(documentData).then((data) => {
        return data
      })
      if (_.isEmpty(documentAddResponse) || _.isNull(documentAddResponse)) {
        return res.status(400).json('An Error Occurred while Uploading documents')
      }
      return res.status(200).json('Action Successful')
    }
  }catch (e) {
    return res.status(400).json("Something went wrong."+e.message);
  }

});

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
module.exports = router;
