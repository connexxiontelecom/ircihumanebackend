'use strict';
const { sequelize, Sequelize } = require('../services/db');
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MasterList extends Model {
    static associate(models) {}
  }
  MasterList.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      location_id: DataTypes.INTEGER,
      regular_term: DataTypes.INTEGER,
      limited_term: DataTypes.INTEGER,
      short_term: DataTypes.INTEGER,
      male: DataTypes.INTEGER,
      female: DataTypes.INTEGER,
      total: DataTypes.INTEGER,
      percentage_workforce: DataTypes.INTEGER,
      cost_per_site: DataTypes.DOUBLE,
      percentage_cost_per_site: DataTypes.DOUBLE,
      new_hire: DataTypes.INTEGER,
      relocate_from: DataTypes.INTEGER,
      relocate_to: DataTypes.INTEGER,
      exit: DataTypes.INTEGER,
      month: DataTypes.INTEGER,
      year: DataTypes.INTEGER,
      sub_category: DataTypes.INTEGER,
      created_at: DataTypes.DATE,
      updated_at: DataTypes.DATE
    },
    {
      sequelize,
      modelName: 'masterList',
      tableName: 'master_list'
    }
  );

  return MasterList;
};
