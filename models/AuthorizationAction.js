'use strict';
const {
    Model
} = require('sequelize');

const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const AuthRole = require("../models/AuthorizationRole")(sequelize, Sequelize.DataTypes);

module.exports = (sequelize, DataTypes) => {
    class AuthorizationAction extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
        static async getAuthorizationActionByAuthTravelAppIdOfficerType(authId, officerId, type){
          return AuthorizationAction.findOne({
            where:{
              auth_travelapp_id:authId,
              auth_officer_id:officerId,
              auth_type: type
            }
          })
        }

        static async markAsReAssignedApplication(authId, type){
          return await AuthorizationAction.update({
            auth_status:3, //reassigned
          },{
            where:{
              auth_travelapp_id:authId,
              //auth_officer_id: officerId,
              auth_type: type
            }
          });
        }
        static async markAuthorizationRequestAsReassigned(authId, officerId, type, status){
          return await AuthorizationAction.update({
            auth_status:status, //reassigned
          },{
            where:{
              auth_travelapp_id:authId,
              auth_officer_id: officerId,
              auth_type: type
            }
          });
        }

        static async addNewAuthOfficer(data){
          return AuthorizationAction.create({
            auth_travelapp_id: data.appId,
            auth_officer_id:data.officer,
            auth_status:data.status,
            auth_type:data.type,
            auth_comment:data.comment,
          })
        }
    };
    AuthorizationAction.init({
        auth_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        auth_travelapp_id: DataTypes.STRING,
        auth_officer_id: {
            type:DataTypes.INTEGER,
            unique:true
        },
        auth_status: {type:DataTypes.INTEGER, defaultValue:0, comment:"0=pending,1=approved,2=declined"},
        auth_type: {type:DataTypes.INTEGER, defaultValue:1, comment:"1=leave,2=time-sheet,3=travel,4=self"},
        auth_comment:{type:DataTypes.STRING, allowNull:true},
        auth_ts_month:{type:DataTypes.STRING, allowNull:true},
        auth_ts_year:{type:DataTypes.STRING, allowNull:true},
        auth_ts_activity:{type:DataTypes.STRING, allowNull:true},
        auth_role_id:{type:DataTypes.INTEGER, allowNull:true},
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        modelName: 'AuthorizationAction',
        tableName: 'authorization_actions',
        //timestamps:false
    });
    AuthorizationAction.belongsTo(AuthRole, { foreignKey: 'auth_role_id', as: 'role' });
    AuthorizationAction.belongsTo(Employee, {foreignKey:'auth_officer_id',  as: 'officers'});


    return AuthorizationAction;
};
