const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const authorizationModel = require("../models/AuthorizationAction")(sequelize, Sequelize.DataTypes);
const travelApplicationModel = require("../models/TravelApplication")(sequelize, Sequelize.DataTypes);
const leaveApplicationModel = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const timeSheetModel = require("../models/timesheet")(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
//const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');


const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

const registerNewAction = async (auth_type, travel_app, officer, status, comment)=>  {
    return await authorizationModel.create({
            auth_officer_id: officer,
            auth_status: status,
            auth_comment: comment,
            auth_type: auth_type,
            auth_travelapp_id:travel_app
        });

}

const updateAuthorizationStatus = async (req, res)=>{

    try{
        const schema = Joi.object({
            //auth_id: Joi.number().required(),
            appId: Joi.number().required(),
            status: Joi.number().required(),
            officer: Joi.number().required(),
            type: Joi.number().required(),
            comment: Joi.string().required(),
            markAsFinal: Joi.number().required().valid(0,1),
            nextOfficer: Joi.alternatives().conditional('markAsFinal',{is: 1, then: Joi.number().required()}),
        });

        const authRequest = req.body
        const validationResult = schema.validate(authRequest)
        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        //res.send(req.body);
        const {auth_id, appId, status, officer, type, comment, markAsFinal, nextOfficer} = req.body;

        const application = await authorizationModel.findOne(
            {
                where:{auth_travelapp_id: appId, auth_type: type, auth_status: 0},
            });

        if(application){
            if(application.auth_officer_id !== officer) return res.status(400).json({message:"You do not have permission to authorize this request."});

            const auth = await authorizationModel.update({
                auth_status: status,
                auth_comment:comment
            },{
                where:{
                    auth_id:auth_id
                }
            });
            if(markAsFinal === 0 ){
                await authorizationModel.create({
                    auth_officer_id: nextOfficer,
                    auth_type: type,
                    auth_travelapp_id:appId
                });

                //Log
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": `Log on authorization: Authorized request.`,
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{
                    res.status(200).json({message: "Your action was registered successfully."});
                });
            }else if(markAsFinal === 1){
                switch (type) {
                    case 1: //leave application
                        await leaveApplicationModel.update({
                            leapp_status:status,
                            leapp_approve_comment:comment,
                            leapp_approve_date:new Date(),
                            leapp_approve_by:officer,
                        },{
                            where:{
                                leapp_id:appId
                            }
                        });
                        break;
                   /* case 2: //time sheet
                        const randStr = Math.random().toString(36).substr(2, 5);
                        await timeSheetModel.update({
                            ts_status:status,
                            ts_comment:comment,
                            ts_date_approved:new Date(),
                            ts_approve_by:officer,
                            ts_ref_no: randStr
                        },{
                            where:{
                                ts_id:appId
                            }
                        });
                        break;*/
                    case 3: //travel application
                        await travelApplicationModel.update({
                            travelapp_status:status,
                            travelapp_approve_comment:comment,
                            travelapp_date_approved:new Date(),
                            travelapp_approved_by:officer,
                        },{
                            where:{
                                travelapp_id:appId
                            }
                        });
                        break;
                }
                //Log
                const logData = {
                    "log_user_id": req.user.username.user_id,
                    "log_description": `Log on authorization: marked request as final.`,
                    "log_date": new Date()
                }
                logs.addLog(logData).then((logRes)=>{
                    res.status(200).json({message: "Your action was registered successfully."});
                });
            }
        }else{
            res.status(404).json({message:"Whoops! The requested record does not exist."});
        }

    }catch (e) {
        return res.status(400).json({message: "Something went wrong. Try again."+e.message});
    }
}

const getAuthorizationByOfficerId = async (officerId, type)=>{
    return await authorizationModel.findAll({where:{auth_officer_id:officerId, auth_type:type}})
}


module.exports = {
    registerNewAction,
    updateAuthorizationStatus,
    getAuthorizationByOfficerId,
}
