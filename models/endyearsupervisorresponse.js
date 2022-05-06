'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EndYearSupervisorResponse extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addSupervisorEndYearResponse(resData){
      return await EndYearSupervisorResponse.create(resData);
    }

    static async getSupervisorEndYearResponseByMasterId(masterId){
      return await EndYearSupervisorResponse.findAll({ where: { eyrs_master_id: masterId } })
    }

  };
  EndYearSupervisorResponse.init({
    eysr_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    eysr_master_id: DataTypes.INTEGER,
    eysr_strength: DataTypes.TEXT,
    eysr_growth: DataTypes.TEXT,
    eysr_rating: DataTypes.INTEGER,
    eysr_additional_comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'EndYearSupervisorResponse',
    tableName: 'end_year_supervisor_responses'
  });
  return EndYearSupervisorResponse;
};
