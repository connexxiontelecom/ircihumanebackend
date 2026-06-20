const { sequelize, Sequelize } = require('./db');
const EnforceAuthorization = require('../models/enforceAuthorization')(
  sequelize,
  Sequelize.DataTypes
);

async function getSingletonRow() {
  let row = await EnforceAuthorization.findOne({ order: [['id', 'ASC']] });

  if (!row) {
    row = await EnforceAuthorization.create({
      updated_by: null,
      enforce: true
    });
  }

  return row;
}

async function getEnforceAuthorizationStatus() {
  const row = await getSingletonRow();
  return {
    id: row.id,
    updated_by: row.updated_by,
    enforce: !!row.enforce
  };
}

async function setEnforceAuthorization(enforce, userId) {
  const row = await getSingletonRow();

  await row.update({
    enforce: !!enforce,
    updated_by: userId ? parseInt(userId, 10) : null
  });

  return {
    id: row.id,
    updated_by: row.updated_by,
    enforce: !!row.enforce
  };
}

module.exports = {
  getEnforceAuthorizationStatus,
  setEnforceAuthorization
};
