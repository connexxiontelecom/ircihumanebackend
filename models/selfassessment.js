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
    sa_comment: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'selfAssessment',
    tableName: 'self_assessments'
  });
  return selfAssessment;
};
