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
    sa_next_steps: DataTypes.TEXT


  }, {
    sequelize,
    modelName: 'selfAssessment',
    tableName: 'self_assessments'
  });
  return selfAssessment;
};
