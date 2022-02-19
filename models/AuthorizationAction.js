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
    };
    AuthorizationAction.init({
        auth_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        auth_travelapp_id: DataTypes.INTEGER,
        auth_officer_id: {
            type:DataTypes.INTEGER,
            unique:true
        },
        auth_status: {type:DataTypes.INTEGER, defaultValue:0, comment:"0=pending,1=approved,2=declined"},
        auth_type: {type:DataTypes.INTEGER, defaultValue:1, comment:"1=leave,2=time-sheet,3=travel,4=self"},
        auth_comment:{type:DataTypes.STRING, allowNull:true},
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
