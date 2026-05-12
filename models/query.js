'use strict';
const {
  Model
} = require('sequelize');
const { sequelize, Sequelize } = require('../services/db');
const employeeModel = require('./Employee')(sequelize, Sequelize)
const queryReplyModel = require('./queryreply')(sequelize, Sequelize)
module.exports = (sequelize, DataTypes) => {
  class Query extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async addQuery(data){
      return await Query.create(data);
    }

    static async getAllQueries(){
      return await Query.findAll({
        order:[['q_id', 'DESC']],
        include:[
          {model: employeeModel, as: 'issuer' },
          {model:employeeModel, as:'offender'},
          {model:queryReplyModel, as:'replies'},
        ]
      })
    }

    static async getAllQueriesByEmployeeId(empId){
      return await Query.findAll({
        where:{q_queried: empId},
        order:[['q_id', 'DESC']],
        include:[
          {model: employeeModel, as: 'issuer' },
          {model:employeeModel, as:'offender'}
        ]
      })
    }

    static async markQueryAsRead(queryId){
      return await Query.update({
        q_is_seen:1
      },{
        where:{q_id:queryId}
      })
    }

    static async getQueryById(id){
      return await Query.findOne({ where:{q_id:id},
        include:[
          {model: employeeModel, as: 'issuer' },
          {model:employeeModel, as:'offender'}
        ]})
    }

    static async updateQueryAttachmentUrl(id, url){
      return await Query.update({
          q_attachment:url,
        },
        {where:{q_id:id},})
    }

  };
  Query.init({
    q_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    q_query_type: DataTypes.INTEGER,
    q_queried_by: DataTypes.INTEGER,
    q_queried: DataTypes.INTEGER,
    q_body: DataTypes.TEXT,
    q_subject: DataTypes.STRING,
    q_attachment: DataTypes.STRING,
    q_is_seen: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Query',
    tableName: 'queries'
  });
  Query.belongsTo(employeeModel, {as:'issuer', foreignKey:'q_queried_by'})
  Query.belongsTo(employeeModel, {as:'offender', foreignKey:'q_queried'})
  Query.hasMany(queryReplyModel, {as: 'replies', foreignKey: 'qr_query_id'})
  return Query;
};
