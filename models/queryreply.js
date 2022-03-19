'use strict';
const {
  Model
} = require('sequelize');
const {sequelize, Sequelize} = require("../services/db");
const employeeModel = require('./Employee')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class QueryReply extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async postReply(data){
      return await QueryReply.create(data);
    }

    static async getAllQueryRepliesByQueryId(queryId){
      return await QueryReply.findAll({
        where:{qr_query_id:queryId},
        include:[
          {model: employeeModel, as: 'employee' }
        ],
        order:[['qr_id', 'DESC']]
      })
    }
  };
  QueryReply.init({
    qr_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    qr_reply: DataTypes.TEXT,
    qr_emp_id: DataTypes.INTEGER,
    qr_reply_source: DataTypes.INTEGER,
    qr_query_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'QueryReply',
    tableName:'query_replies'
  });
  QueryReply.belongsTo(employeeModel, {as:"employee", foreignKey:"qr_emp_id"})
  return QueryReply;
};
