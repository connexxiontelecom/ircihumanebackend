'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class endOfYearAssessment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getLeaveAccrualByLeaveId(gsId){
      return await endOfYearAssessment.findAll(
        {where:{eya_gs_id:gsId}
        });
    }

  }
  endOfYearAssessment.init({
    eya_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    eya_gs_id: DataTypes.STRING,
    eya_year: DataTypes.STRING,
    eya_question: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'endOfYearAssessment',
    tableName: 'end_year_assessments'
  });
  return endOfYearAssessment;
};
