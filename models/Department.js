'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
    Model
} = require('sequelize');
//const EmployeeModel = require("../models/Employee")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class Department extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    Department.init({
        department_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        department_name: DataTypes.STRING,
        d_t3_code: DataTypes.STRING,
        d_sector_lead_id: DataTypes.INTEGER,
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
        modelName: 'Department',
        tableName: 'departments'
    });
  // Department.belongsTo(EmployeeModel, {as: 'sector_lead', foreignKey: 'd_sector_lead_id'})

    return Department;
};
