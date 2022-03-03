'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class LeaveType extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    LeaveType.init({
        leave_type_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        leave_name: DataTypes.STRING,
        leave_duration: DataTypes.INTEGER,
        lt_mode: DataTypes.INTEGER,
        lt_rate: DataTypes.DOUBLE,
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
        modelName: 'LeaveType',
        tableName: 'leave_types'
    });
    return LeaveType;
};
