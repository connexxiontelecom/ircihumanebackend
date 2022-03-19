'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class WorkExperience extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addWorkExperience(data){
      return await WorkExperience.create(data);
    }

    static async updateWorkExperience(req,id){
      return await WorkExperience.update({
        we_emp_id : parseInt(req.body.employee),
        we_organization : req.body.organization,
        we_job_role : req.body.role,
        we_start_date: req.body.start_date,
        we_end_date: req.body.end_date,
      },{
        where:{
          we_id:id
        }
      })
    }

    static async getEmployeeWorkExperienceList(emp_id){
      return await WorkExperience.findAll({where:{we_emp_id:emp_id}})
    }

  };
  WorkExperience.init({
    we_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    we_emp_id: DataTypes.INTEGER,
    we_organization: DataTypes.STRING,
    we_job_role: DataTypes.STRING,
    we_description: DataTypes.STRING,
    we_start_date: DataTypes.DATE,
    we_end_date: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'WorkExperience',
    tableName:'work_experiences'
  });
  return WorkExperience;
};
