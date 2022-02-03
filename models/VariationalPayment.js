'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class VariationalPayment extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    VariationalPayment.init({
        vp_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        vp_emp_id: DataTypes.INTEGER,
        vp_payment_def_id: DataTypes.INTEGER,
        vp_amount: DataTypes.DOUBLE,
        vp_confirm: {type: DataTypes.INTEGER, comment:"0=pending,1=approved,2=discarded"},
        vp_payment_month: DataTypes.INTEGER,
        vp_payment_year: DataTypes.INTEGER,
        vp_confirmed_by: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'VariationalPayment',
        tableName: 'variational_payments',
        timestamps:false
    });
    return VariationalPayment;
};
