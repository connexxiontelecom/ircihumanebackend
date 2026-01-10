'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class TaxRelief extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  TaxRelief.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    emp_id: DataTypes.STRING,
    relief_type_id: DataTypes.INTEGER,
    amount_provided: DataTypes.FLOAT,
    relief_amount: DataTypes.FLOAT,
    start_date: DataTypes.DATE,
    end_date: DataTypes.DATE,
    document: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'TaxRelief',
    tableName: 'tax_reliefs'
  });
  return TaxRelief;
};

