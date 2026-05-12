'use strict';
const {
    Model, Op
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class PerformanceImprovement extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }

      static async getPerformanceImprovement() {
        return PerformanceImprovement.findAll({
          include:[
            {model: Employee, as: 'employee' }
          ],
        })
      }
      static async getEmployeePerformanceImprovement(empId) {
        return PerformanceImprovement.findAll({
          where:{pi_emp_id: empId},
        })
      }
      static async getPerformanceImprovementById(id) {
        return PerformanceImprovement.findOne({
          where:{pi_id: id},
        })
      }
      static async getEmployeeActivePerformanceImprovement(empId) {
        return PerformanceImprovement.findOne({
          where:{pi_emp_id: empId, pi_status:1},
        })
      }
      static async addPerformanceImprovement(data) {
        return PerformanceImprovement.create({
          pi_emp_id: data.emp_id,
          pi_start_date: data.start_date,
          pi_end_date: data.end_date,
          pi_status: data.status,
        })
      }

      static async updatePerformanceStatus(id, status){
        return await PerformanceImprovement.update({
            pi_status:status,
          },
          {where:{pi_id:id},})
      }


      static async updatePerformanceDetails(id, status, start, end){
        return await PerformanceImprovement.update({
            pi_status:status,
            pi_start_date:start,
            pi_end_date:end,
          },
          {where:{pi_id:id},})
      }


      static async deletePerformanceImprovement(id){
        return await PerformanceImprovement.destroy(
          {where:{pi_id:id},})
      }

    };
  PerformanceImprovement.init({
        pi_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        pi_emp_id: DataTypes.INTEGER,
        pi_status: DataTypes.INTEGER,
        pi_start_date: DataTypes.DATE,
        pi_end_date: DataTypes.DATE,
        created_at: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updated_at: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        modelName: 'PerformanceImprovement',
        tableName: 'performance_improvement',
    timestamps:false
    });
  PerformanceImprovement.belongsTo(Employee, { foreignKey: 'pi_emp_id',as:"employee" });
    return PerformanceImprovement;
};
