'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class selfAssessment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getSelfAssessmentByGoalEmpId(goalId, empId){
      return await selfAssessment.findAll({where:{sa_gs_id:goalId, sa_emp_id:empId}})
    }

    /*static async updateSelfAssessmentStatus(data, goalId, empId){
      return await selfAssessment.update({
        sa_supervisor_id:data.supervisor,
        sa_date_approved:new Date(),
        sa_supervisor_comment:data.comment,
        sa_status:data.status,
        sa_master_id:data.master,
      },{
        where:{sa_gs_id:goalId, sa_emp_id:empId}
      })
    }*/
  };
  selfAssessment.init({
    sa_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    sa_gs_id: DataTypes.STRING,
    sa_emp_id: DataTypes.STRING,
    sa_comment: DataTypes.STRING,
    sa_response: DataTypes.STRING,
    sa_eya_id: DataTypes.INTEGER,
    sa_status: DataTypes.INTEGER,
    sa_master_id: DataTypes.INTEGER,
    sa_update: DataTypes.TEXT,
    sa_accomplishment: DataTypes.TEXT,
    sa_challenges: DataTypes.TEXT,
    sa_support_needed: DataTypes.TEXT,
    sa_next_steps: DataTypes.TEXT,
    createdAt: {
      //field: 'created_at',
      type: DataTypes.DATE,
      defaultValue:sequelize.literal('CURRENT_TIMESTAMP'),
    },
    updatedAt: {
      //field: 'updated_at',
      type: DataTypes.DATE,
      defaultValue:sequelize.literal('CURRENT_TIMESTAMP'),
    },

  }, {
    sequelize,
    modelName: 'selfAssessment',
    tableName: 'self_assessments',
    timestamps:false,
  });
  return selfAssessment;
};
