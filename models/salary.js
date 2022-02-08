'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class salary extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  salary.init({
    salary_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    salary_empid: DataTypes.INTEGER,
    salary_paymonth: DataTypes.TEXT,
    salary_payyear: DataTypes.TEXT,
    salary_pd: DataTypes.INTEGER,
    salary_share: DataTypes.DOUBLE,
    salary_tax: DataTypes.INTEGER,
    salary_confirmed: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'salary',
    tableName: 'salary'
  });
  return salary;
};
