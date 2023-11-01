'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
const ratingModel = require('./rating')(sequelize, Sequelize)
const selfAssessmentMasterModel = require('./selfassessmentmaster')(sequelize, Sequelize)
const endOfYearResponseModel = require('./endofyearresponse')(sequelize, Sequelize)
const endOfYearAssessmentModel = require('./endofyearassessment')(sequelize, Sequelize)
const locationModel = require('./Location')(sequelize, Sequelize)
const sectorModel = require('./Department')(sequelize, Sequelize)
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
        include:[
          {model:employeeModel, as:'supervisor'},
          {model:ratingModel, as:'rating'},
          {model:selfAssessmentMasterModel, as:'selfAssessment',
            include:[
              {model:employeeModel, as:'employee',
                include: [
                  {model: locationModel, as: 'location'},
                  {model: sectorModel, as: 'sector'},
                ]
              },
              {model:endOfYearResponseModel, as:'end_year_response',
                /*include: [
                  { model: endOfYearAssessmentModel, as: 'end_year_assessment'}
                ]*/
              },
            ]
          },

        ]
      })
    }

    static async getSupervisorEndYearResponseReport(masterId){
      return await EndYearSupervisorResponse.findAll({ where: { eysr_master_id: masterId },
        include:[
          {model:employeeModel, as:'supervisor'},
          {model:ratingModel, as:'rating'},
          {model:selfAssessmentMasterModel, as:'selfAssessment',
            include:[
              {model:employeeModel, as:'employee',
                include: [
                  {model: locationModel, as: 'location'},
                  {model: sectorModel, as: 'sector'},
                ]
              },
              {model:endOfYearResponseModel, as:'end_year_response',
              },
            ]
          },

        ]
      })
    }

    static async getSupervisorEndYearResponseByMasterIdOnly(masterId){
      return await EndYearSupervisorResponse.findAll({ where: { eysr_master_id: masterId },
        include:[
          {model:employeeModel, as:'supervisor'},
          {model:ratingModel, as:'rating'},
          {model:selfAssessmentMasterModel, as:'selfAssessment'},
        ]
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
  EndYearSupervisorResponse.belongsTo(selfAssessmentMasterModel, {as:'selfAssessment', foreignKey:'eysr_master_id'});
  EndYearSupervisorResponse.hasMany(endOfYearResponseModel, {as:'end_of_year_response', foreignKey:'eyr_master_id'});
  return EndYearSupervisorResponse;
};
