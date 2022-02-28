'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class TimeSheetPenalty extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    TimeSheetPenalty.init({
        tsp_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        tsp_emp_id: DataTypes.INTEGER,
        tsp_month: DataTypes.INTEGER,
        tsp_year: DataTypes.INTEGER,
        tsp_amount: DataTypes.DOUBLE,
        tsp_days_absent: DataTypes.INTEGER,
        tsp_status: {
            type:DataTypes.INTEGER,
            defaultValue:0,
            comment:'0=yet to be deducted,1=deducted'
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
        modelName: 'TimeSheetPenalty',
        tableName: 'time_sheet_penalties'
    });
    return TimeSheetPenalty;
};
