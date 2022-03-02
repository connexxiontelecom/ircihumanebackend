'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class EmployeeCategory extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    EmployeeCategory.init({
        ec_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        ec_name: DataTypes.STRING,
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
        modelName: 'EmployeeCategory',
        tableName: 'employee_categories'
    });
    return EmployeeCategory;
};
