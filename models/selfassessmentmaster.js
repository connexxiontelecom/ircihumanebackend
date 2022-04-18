'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class selfassessmentmaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  selfassessmentmaster.init({
    sam_id:{
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    sam_gs_id: DataTypes.INTEGER,
    sam_emp_id: DataTypes.INTEGER,
    sam_status: DataTypes.INTEGER,
    sam_supervisor_id: DataTypes.INTEGER,
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
    modelName: 'self_assessment_master',
    tableName: 'self_assessment_master',
    timestamps:false
  });
  return selfassessmentmaster;
};
