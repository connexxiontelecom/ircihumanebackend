'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
const ratingModel = require('./rating')(sequelize, Sequelize)
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

    static async updateSupervisorEndYearResponse(resData, masterId){
      return await EndYearSupervisorResponse.update(
        resData,
        {
          where: {eysr_master_id: masterId}
        }
      );
    }

    static async getSupervisorEndYearResponseByMasterId(masterId){
      return await EndYearSupervisorResponse.findAll({ where: { eysr_master_id: masterId },
        include:[{model:employeeModel, as:'supervisor'}, {model:ratingModel, as:'rating'}]
      })
    }

    static async  updateEndYearSupervisorStatus(eyaId, eyaQuestion) {

      return await EndYearSupervisorResponse.update({
        eysr_status: 1 //approved
      }, {
        where: {
          eysr_master_id: eyaId
        }

      })
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
    eysr_status: DataTypes.INTEGER,
    eysr_supervisor_id: DataTypes.INTEGER,
    eysr_additional_comment: DataTypes.TEXT
  }, {
    sequelize,
    modelName: 'EndYearSupervisorResponse',
    tableName: 'end_year_supervisor_responses'
  });
  EndYearSupervisorResponse.belongsTo(employeeModel, {as:'supervisor', foreignKey:'eysr_supervisor_id'});
  EndYearSupervisorResponse.belongsTo(ratingModel, {as:'rating', foreignKey:'eysr_rating'});
  return EndYearSupervisorResponse;
};
