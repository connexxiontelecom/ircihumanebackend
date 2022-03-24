'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LeaveAppDocument extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async saveLeaveSupportingDocuments(data){
      return await LeaveAppDocument.create(data);
    }

    static async getDocumentsByLeaveId(leaveId){
      return await LeaveAppDocument.findAll({
        where:{leavedoc_leave_id: leaveId}
      })
    }


  };
  LeaveAppDocument.init({
    leavedoc_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    leavedoc_leave_id: DataTypes.INTEGER,
    leavedoc_url: DataTypes.STRING,
    leavedoc_filename: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'LeaveAppDocuments',
    tableName: 'leave_app_documents'
  });
  return LeaveAppDocument;
};
