'use strict';
const {
  Model
} = require('sequelize');
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
  };
  leaveAccrual.init({
    lea_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    lea_emp_id: DataTypes.INTEGER,
    lea_month:DataTypes.INTEGER,
    lea_year: DataTypes.INTEGER,
    lea_leave_type: DataTypes.INTEGER,
    lea_rate: DataTypes.DECIMAL,

  }, {
    sequelize,
    modelName: 'leaveAccrual',
    tableName: 'leave_accruals'
  });
  return leaveAccrual;
};
