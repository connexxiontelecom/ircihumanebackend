'use strict';
const {
    Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
const leaveTypeModel = require('./LeaveType')(sequelize, Sequelize)
const locationModel = require('./Location')(sequelize, Sequelize)
const jobRoleModel = require('./JobRole')(sequelize, Sequelize)
const departmentModel = require('./Department')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
    class leaveAccrual extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }

        static async getAllLeaveAccruals() {
            return await leaveAccrual.findAll({
                where: {lea_archives: 0},
                include: [
                    {
                        model: employeeModel, as: 'employee',
                        include: [
                            {model: locationModel, as: 'location'},
                            {model: jobRoleModel},
                            {model: departmentModel, as: 'sector'}
                        ]
                    },
                    {model: leaveTypeModel, as: 'leave_type'},
                    // {model:locationModel, as:'emp_location'},
                ]
            })
        }
    };
    leaveAccrual.init({
        lea_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        lea_emp_id: DataTypes.INTEGER,
        lea_month: DataTypes.INTEGER,
        lea_year: DataTypes.INTEGER,
        lea_leave_type: DataTypes.INTEGER,
        lea_rate: DataTypes.DECIMAL,

    }, {
        sequelize,
        modelName: 'leaveAccrual',
        tableName: 'leave_accruals'
    });
    leaveAccrual.belongsTo(employeeModel, {as: 'employee', foreignKey: 'lea_emp_id'})
    leaveAccrual.belongsTo(leaveTypeModel, {as: 'leave_type', foreignKey: 'lea_leave_type'})
    //employeeModel.belongsTo(locationModel, {as:'emp_location', foreignKey:'emp_location_id'})
    return leaveAccrual;
};
