const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const authorizationRoleModel = require("../models/AuthorizationRole")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService');


const helper  =require('../helper');
const errHandler = (err) =>{
    console.log("Error: ", err);
}

const getAllAuthorizationRoles = async  ()=>{
    return await authorizationRoleModel.findAll();
}

const addAuthorizationRole = async (requestBody)=>  {
    return await authorizationRoleModel.create({
        ar_title: requestBody.title,
        ar_type: requestBody.type,
    });

}



const updateAuthorizationRole = async (requestBody, id)=>{
      return      await authorizationRoleModel.update({
                ar_title: requestBody.title,
                ar_type:requestBody.type
            },{
                where:{
                    ar_id:id
                }
            });


}


const getAuthorizationRoleById = async (id)=>{
    return await authorizationRoleModel.findOne({where:{ar_id:id}})
}




module.exports = {
    getAllAuthorizationRoles,
    addAuthorizationRole,
    updateAuthorizationRole,
    getAuthorizationRoleById,

}
