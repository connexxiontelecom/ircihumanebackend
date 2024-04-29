const { sequelize } = require('../services/db');
const { DataTypes, Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class TravelApplicationAttachment extends Model {
    static associate(models) {}
  }

  TravelApplicationAttachment.init(
    {
      ta_attachment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ta_attachment_travelapp_id: DataTypes.INTEGER,
      ta_attachment_doc: DataTypes.STRING,
      ta_attachment_filename: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'TravelApplicationAttachment',
      tableName: 'travel_application_attachments'
    }
  );

  return TravelApplicationAttachment;
};
