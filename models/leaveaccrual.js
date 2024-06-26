'use strict';
const {
    Model,
  Op,
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

        static async addLeaveAccrual(empId, month, year, leaveType, noOfDays, expiresOn){
          const calendarYear = month <= 9 ? `FY${year}` : `FY${year+1}`;
          leaveAccrual.create({
              lea_emp_id: empId,
              lea_month: month,
              lea_year: year,
              lea_leave_type: leaveType,
              lea_rate: noOfDays,
              lea_expires_on: expiresOn || null,
              lea_fy: calendarYear
            })
        }

        static async getAllLeaveAccruals(year) {
            return await leaveAccrual.findAll({
              attributes:['lea_id', 'lea_emp_id',
                'lea_month', 'lea_year', 'lea_leave_type', 'lea_rate', 'lea_archives', 'lea_fy',
                [sequelize.fn('sum', sequelize.col('lea_rate')), 'total']
              ],
              where:{lea_fy:year, lea_rate: {[Op.gt]: 0} },
              group:['lea_emp_id'],
              //having: {lea_rate: {[Op.gt]: 0} }//sequelize.literal(`lea_rate > 0`),
            })
        }
        static async getAllLeaveAccrualsByYear(year) {
            return await leaveAccrual.findAll({
                attributes:['lea_id', 'lea_emp_id',
                  'lea_month', 'lea_year', 'lea_leave_type', 'lea_rate', 'lea_archives',
                  [sequelize.fn('sum', sequelize.col('lea_rate')), 'total']
                ],
                group:['lea_emp_id'],
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
              ],
                where: {lea_archives: 0, lea_fy: year, lea_rate: { [Op.gt] : 0 } },


            })
        }
        static async getAllLeaveAccrualsByYearEmpId(year, empId) {
           /* return await leaveAccrual.findAll({
                attributes:['lea_id', 'lea_emp_id',
                  'lea_month', 'lea_year', 'lea_leave_type', 'lea_archives',
                  [sequelize.literal(`(SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_rate > 0 AND lea_emp_id = ${empId} AND lea_year = ${year} GROUP BY lea_leave_type ) `),'totalAccrued'],
                  [sequelize.literal(`(SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_rate < 0 AND lea_emp_id = ${empId} AND lea_year = ${year} GROUP BY lea_leave_type) `),'totalTaken'],
                ],
                group:['lea_leave_type'],
              include: [
                {model: leaveTypeModel, as: 'leave_type'},
              ],
                where: {lea_archives: 0, lea_year: year, lea_emp_id: empId}, //SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_rate > 0 AND lea_emp_id = 1 AND lea_year = 2022 GROUP BY lea_leave_type
            })*/
          //return await sequelize.query(`(SELECT SUM(lea_rate) FROM leave_accruals WHERE lea_rate > 0 AND lea_emp_id = ${empId} AND lea_year = ${year} GROUP BY lea_leave_type)`);
          /*return await leaveAccrual.findAll({
            attributes:[
              [sequelize.fn('SUM', sequelize.col('lea_rate')),'totalAccrued'],
              //[sequelize.fn('SUM', sequelize.col('lea_rate')),'totalTaken'],
              'lea_rate'],
            group:['lea_leave_type'],
            include: [
              {model: leaveTypeModel, as: 'leave_type'},
            ],
            where: {lea_archives: 0, lea_year: year, lea_emp_id: empId, lea_rate:  { [Op.gt] : 0 }}

          })*/
          return await sequelize.query(`(SELECT SUM(lea_rate) FROM leave_accruals 
          WHERE lea_rate > 0 AND lea_emp_id = ${empId} AND lea_year = ${year} GROUP BY lea_leave_type)`);
        }
      static async getTotalAccruedAllLeaveAccrualsByYearEmpId(year, empId) {
        return await leaveAccrual.findAll({
          attributes:[
            //[sequelize.fn('SUM', sequelize.col('lea_rate')),'totalAccrued'],
            'lea_emp_id','lea_rate', 'lea_expires_on'],
          //group:['lea_leave_type'],
          include: [
            {model: leaveTypeModel, as: 'leave_type'},
          ],
          where: {lea_fy: year, lea_emp_id: empId}

        })
      }

      static async getLeaveAccrualByLeaveType(year, empId, leaveType) {
        return await leaveAccrual.findAll({
          attributes:[
            'lea_emp_id','lea_rate', 'lea_leave_type', 'lea_expires_on', 'leave_narration', 'lea_month', 'lea_year'],
          where: {lea_fy: year, lea_emp_id: empId, lea_leave_type:leaveType}

        })
      }
      static async getTotalTakenLeaveAccrualsByYearEmpId(year, empId) {
        return await leaveAccrual.findAll({
          attributes:[
            [sequelize.fn('SUM', sequelize.col('lea_rate')),'totalAccrued'],
            'lea_rate'],
          group:['lea_emp_id'],
          include: [
            {model: leaveTypeModel, as: 'leave_type'},
          ],
          where: {lea_archives: 0, lea_year: year, lea_emp_id: empId, lea_rate:  { [Op.lt] : 0 }}

        })
      }
      static async getTotalArchiveLeaveAccrualsByYearEmpId(year, empId) {
        return await leaveAccrual.findAll({
          attributes:[
            [sequelize.fn('SUM', sequelize.col('lea_rate')),'totalAccrued'],
            'lea_rate'],
          group:['lea_emp_id'],
          include: [
            {model: leaveTypeModel, as: 'leave_type'},
          ],
          where: {lea_archives: 1, lea_fy: year, lea_emp_id: empId}

        })
      }
      static async getEmployeeUsedLeaveAccrualsByYearEmpId(year, empId) {
        return await leaveAccrual.findAll({
          attributes:['lea_id', 'lea_emp_id',
            'lea_month', 'lea_year', 'lea_leave_type', 'lea_rate', 'lea_archives',
            [sequelize.fn('sum', sequelize.col('lea_rate')), 'total']
          ],
          group:['lea_emp_id', 'lea_leave_type'],
          where: {lea_archives: 0, lea_fy: year, lea_emp_id: empId, lea_rate: { [Op.lt] : 0 } },
        })
      }
      static async getEmployeeLeftLeaveAccrualsByYearEmpId(year, empId) {
        return await leaveAccrual.findAll({
          attributes:['lea_id', 'lea_emp_id',
            'lea_month', 'lea_year', 'lea_leave_type', 'lea_rate', 'lea_archives',
            [sequelize.fn('sum', sequelize.col('lea_rate')), 'total']
          ],
          group:['lea_emp_id', 'lea_leave_type'],
          where: {lea_archives: 0, lea_fy: year, lea_emp_id: empId, lea_rate: { [Op.gt] : 0 } },
        })
      }
      static async getEmployeeArchivedLeaveAccrualsByYearEmpId(year, empId) {
        return await leaveAccrual.findAll({
          attributes:['lea_id', 'lea_emp_id',
            'lea_month', 'lea_year', 'lea_leave_type', 'lea_rate', 'lea_archives',
            [sequelize.fn('sum', sequelize.col('lea_rate')), 'total']
          ],
          group:['lea_emp_id', 'lea_leave_type'],
          where: {lea_archives: 1, lea_year: year, lea_emp_id: empId },

        })
      }
      static async getLeaveAccrualByRateEmpIdLeaveId(rate, empId, leaveId) {
        return await leaveAccrual.findOne({
          where: {lea_rate: rate, lea_leaveapp_id: leaveId, lea_emp_id: empId },

        })
      }   
      static async getLeaveAccrualByLeaveApplicationId(leaveId) {
        return await leaveAccrual.findOne({
          where: {lea_leaveapp_id: leaveId},

        })
      }

      static async getLeaveAccrualByLeaveApplicationIdAndMore(leaveId) {
        return await leaveAccrual.findOne({
          where: {
            lea_leaveapp_id: leaveId,
            lea_rate: {[Op.lte]:0},
            lea_fy: 'FY2024'
          },

        })
      }
      static async destroyLeaveAccrualByRateEmpIdLeaveId(rate, empId, leaveId) {
        return await leaveAccrual.destroy({
          where: {lea_rate: rate, lea_leaveapp_id: leaveId, lea_emp_id: empId },

        })
      }

      static async deleteLeaveAccrualEntryByLeaveId(leaveId) {
        return await leaveAccrual.destroy({
          where: {lea_leaveapp_id: leaveId },

        })
      }
      static async getAllLeaveAccrualsByEmployeeId(empId, year) {
        return await leaveAccrual.findAll({
          attributes:['lea_id', 'lea_emp_id',
            'lea_month', 'lea_year', 'lea_leave_type', 'lea_rate', 'lea_archives',
            [sequelize.fn('sum', sequelize.col('lea_rate')), 'total']
          ],
          group:['lea_emp_id'],
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
          ],
          where: {lea_archives: 0, lea_emp_id: empId, lea_year: year},


        })
      }

      static async getLeaveAccrualByLeaveId(leaveId){
        return await leaveAccrual.findOne(
          {where:{lea_leaveapp_id:leaveId}
          });
      }
      static async updateLeaveAccrualDuration(leaveId, duration){
        return await leaveAccrual.update({
            lea_rate: 0 - duration},
          {where:{lea_leaveapp_id:leaveId}
          });
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
        lea_expires_on: DataTypes.DATEONLY,
        lea_archives: DataTypes.INTEGER,
        lea_fy: DataTypes.STRING,
        leave_narration: DataTypes.STRING,
        lea_leaveapp_id: DataTypes.INTEGER,

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
