'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
    Model
} = require('sequelize');
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes)
const Pd = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)


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

    VariationalPayment.belongsTo(Employee, { as:'employee', foreignKey: 'vp_emp_id' })
    VariationalPayment.hasMany(Employee, { foreignKey: 'emp_id' })


    VariationalPayment.belongsTo(Pd, { as:'payment', foreignKey: 'vp_payment_def_id' })
    VariationalPayment.hasMany(Pd, { foreignKey: 'pd_id' })


    return VariationalPayment;
};
