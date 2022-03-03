'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class AuthorizationRole extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    AuthorizationRole.init({
        ar_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        ar_title: DataTypes.STRING,
        ar_type: {
            type:DataTypes.INTEGER,
            defaultValue:1,
            comment:'1=leave,2=timesheet,3=travel'
        },
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
        modelName: 'AuthorizationRole',
        tableName: 'authorization_roles'
    });
    return AuthorizationRole;
};
