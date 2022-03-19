'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Education extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addEducation(data){
     return await Education.create(data);
    }

    static async updateEducation(req,id){
      return await Education.update({
        e_emp_id : parseInt(req.body.employee),
        e_institution : req.body.institution,
        e_program : req.body.program,
        e_qualification: req.body.qualification,
        e_start_date: req.body.start_date,
        e_end_date: req.body.end_date,
      },{
        where:{
          e_id:id
        }
      })
    }

    static async getEmployeeEducationList(emp_id){
      return await Education.findAll({where:{e_emp_id:emp_id}})
    }
  };
  Education.init({
    e_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    e_emp_id: DataTypes.INTEGER,
    e_institution: DataTypes.STRING,
    e_program: DataTypes.STRING,
    e_qualification: DataTypes.STRING,
    e_start_date: DataTypes.DATE,
    e_end_date: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Education',
    tableName:'education'
  });
  return Education;
};
