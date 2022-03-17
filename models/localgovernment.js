'use strict';
const {
  Model
} = require('sequelize');
const { sequelize, Sequelize } = require('../services/db');
const stateModel = require('./State')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class LocalGovernment extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addLocalGovernment(data){
      return await LocalGovernment.create(data);
    }

    static async getAllLocalGovernmentsByStateId(state_id){
      return await LocalGovernment.findAll({where:{lg_state_id:state_id}});
    }

    static async getAllLocalGovernments(){
      return await LocalGovernment.findAll({
        order:[['lg_state_id', 'ASC']],
        include:[{model: stateModel, as: 'lga'}]
      })
    }

    static async updateLocationGovernment(req, id){
      return await  LocalGovernment.update({
        lg_state_id: req.body.state,
        lg_name:req.body.lg_name,
      },{
        where:{
          lg_id:parseInt(id)
        }
      });
    }
  };
  LocalGovernment.init({
    lg_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    lg_state_id: DataTypes.INTEGER,
    lg_name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'LocalGovernment',
    tableName:'local_governments'
  });
  LocalGovernment.belongsTo(stateModel, {as: 'lga', foreignKey: 'lg_state_id'})
  return LocalGovernment;
};
