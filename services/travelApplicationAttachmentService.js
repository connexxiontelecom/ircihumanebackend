const { sequelize, Sequelize } = require('./db');
const travelApplicationAttachment = require('../models/TravelApplicationAttachment')(sequelize, Sequelize.DataTypes);

const setNewTravelApplicationAttachment = async (attachment, travelapp_id) => {
  return await travelApplicationAttachment.create({
    ta_attachment_travelapp_id: travelapp_id,
    ta_attachment_doc: attachment.doc,
    ta_attachment_filename: attachment.filename
  });
};

const deleteTravelApplicationAttachment = async (ta_attachment_doc) => {
  return await travelApplicationAttachment.destroy({ where: { ta_attachment_doc } });
};

const findAttachmentsByTravelApplicationId = async (travelapp_id) => {
  return await travelApplicationAttachment.findAll({ where: { ta_attachment_travelapp_id: travelapp_id } });
};

module.exports = {
  setNewTravelApplicationAttachment,
  deleteTravelApplicationAttachment,
  findAttachmentsByTravelApplicationId
};
