'use strict';
const {
    Model, Op
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes);
const performanceAssessmentModel = require("../models/PerformancePlanAssessment")(sequelize, Sequelize.DataTypes);
//const performancePlanSupervisorResponseModel = require("../models/PerformancePlanSupervisorResponse")(sequelize, Sequelize.DataTypes);
//const performancePlanCompetencyModel = require("../models/PerformancePlanCategoriesOfCompetency")(sequelize, Sequelize.DataTypes);
//const performancePlanOverallModel = require("../models/PerformancePlanOverallPerformance")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class PerformancePlanMaster extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
      static async addPerformancePlanMaster(data) {
        return PerformancePlanMaster.create({
          ppm_emp_id: data.emp_id,
          ppm_start_date: data.start_date,
          ppm_end_date: data.end_date,
          ppm_status: data.status,
          ppm_supervisor_id: data.supervisor_id,
          ppm_type: data.type,
        })
      }
      static async getEmployeePerformancePlanMasterByEmpId(empId) {
        return PerformancePlanMaster.findAll({
          where:{ppm_emp_id: empId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            //{model: performancePlanSupervisorResponseModel, as: 's_response' },

          ],
        })
      }
      static async getEmployeePerformancePlanMasterDetailByEmpId(empId) {
        return PerformancePlanMaster.findAll({
          where:{ppm_emp_id: empId},
          include:[
            {model: Employee, as: 'employee' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }

      static async getSingleEmployeePerformancePlanMasterDetailById(performanceId) {
        return PerformancePlanMaster.findOne({
          where:{ppm_id: performanceId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }

      static async getSinglePerformanceAssessmentBySupervisorId(supervisorId) {
        return PerformancePlanMaster.findOne({
          where:{ppm_supervisor_id: supervisorId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }



      static async getSinglePerformanceAssessmentById(id) {
        return PerformancePlanMaster.findOne({
          where:{ppm_id: id},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }

/*
      static async getSingleEndOfYearPerformanceAssessmentById(id) {
        return PerformancePlanMaster.findOne({
          where:{ppm_id: id},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'},

          ],
        })
      }*/



      static async getAllPerformanceAssessmentBySupervisorId(supervisorId) {
        return PerformancePlanMaster.findAll({
          where:{ppm_supervisor_id: supervisorId},
          include:[
            {model: Employee, as: 'employee' },
            {model: Employee, as: 'supervisor' },
            {model: performanceAssessmentModel, as: 'assessment'}
          ],
        })
      }



      static async getAllPerformancePlanMaster() {
        return PerformancePlanMaster.findAll({
          include:[
            {model: Employee, as: 'employee' }
          ],
        })
      }



      static async approvePerformanceAssessment(status,id){
        return await PerformancePlanMaster.update({
            ppm_status:status,
          },
          {where:{ppm_id:id},})
      }

      static async updatePerformanceAssessment(data, performanceId){
        return await PerformancePlanMaster.update(
          data,
          {where:{ppm_id:performanceId},})
      }

    };
  PerformancePlanMaster.init({
        ppm_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        ppm_emp_id: DataTypes.STRING,
        ppm_status: DataTypes.INTEGER,
        ppm_start_date: DataTypes.DATE,
        ppm_end_date: DataTypes.DATE,
        ppm_type: DataTypes.INTEGER,
        ppm_supervisor_id: DataTypes.INTEGER,
        ppm_supervisor_comment: DataTypes.TEXT,
        ppm_accomplishments: DataTypes.TEXT,
        ppm_challenges: DataTypes.TEXT,
        ppm_general_comments: DataTypes.TEXT,
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
        modelName: 'PerformancePlanMaster',
        tableName: 'performance_plan_master',
    timestamps:false
    });
    PerformancePlanMaster.belongsTo(Employee, { foreignKey: 'ppm_emp_id',as:"employee" });
    PerformancePlanMaster.belongsTo(Employee, { foreignKey: 'ppm_supervisor_id',as:"supervisor" });



    PerformancePlanMaster.hasMany(performanceAssessmentModel, { foreignKey: 'ppa_ppm_id',as:"assessment" });
    return PerformancePlanMaster;
}; //ppcoc_ppm_id
