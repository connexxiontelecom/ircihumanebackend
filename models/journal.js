'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class journal extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  journal.init(
    {
      j_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      j_acc_code: DataTypes.STRING,
      j_date: DataTypes.STRING,
      j_ref_code: DataTypes.STRING,
      j_d_c: DataTypes.STRING,
      j_desc: DataTypes.STRING,
      j_amount: DataTypes.DOUBLE,
      j_t1: DataTypes.STRING,
      j_t2: DataTypes.STRING,
      j_t3: DataTypes.STRING,
      j_t4: DataTypes.STRING,
      j_t5: DataTypes.STRING,
      j_t6: DataTypes.STRING,
      j_t7: DataTypes.STRING,
      j_month: DataTypes.INTEGER,
      j_year: DataTypes.INTEGER,
      j_name: DataTypes.STRING,
      j_vendor_account: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'journal',
      tableName: 'journals'
    }
  );
  return journal;
};
