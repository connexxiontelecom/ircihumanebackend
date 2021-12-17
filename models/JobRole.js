'use strict';
const {
    Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Department = require("../models/Department")(sequelize, Sequelize.DataTypes);

module.exports = (sequelize, DataTypes) => {
    class JobRole extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    JobRole.init({
        job_role_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        job_role: DataTypes.STRING,
        description: DataTypes.STRING,
        jb_department_id: DataTypes.INTEGER,
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
        modelName: 'JobRole',
        tableName: 'job_roles'
    });
    Department.belongsTo(JobRole, { foreignKey: 'jb_department_id' })
    JobRole.hasMany(Department, { foreignKey: 'department_id' })


    return JobRole;
};
