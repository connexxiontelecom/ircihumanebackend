'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class HrFocalPoint extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addHrFocalPoint(data){
      return await HrFocalPoint.create(data);
    }

    static async getHrFocalPoints(){
      return await HrFocalPoint.findAll({
        include:[{model:employeeModel, as:'focal_person'}]
      });
    }

    static async getHrFocalPointsByLocationId(locationId){
      return await HrFocalPoint.findAll({
        where:{hfp_location_id:locationId},
        include:[{model:employeeModel, as:'focal_person'}]
      });
    }

  };
  HrFocalPoint.init({
    hfp_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    hfp_location_id: DataTypes.INTEGER,
    hfp_emp_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'HrFocalPoint',
    tableName:'hr_focal_points'
  });
  HrFocalPoint.belongsTo(employeeModel, {as:'focal_person', foreignKey:'hfp_emp_id'});
  return HrFocalPoint;
};
