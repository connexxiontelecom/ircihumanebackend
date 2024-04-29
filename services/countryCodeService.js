const Joi = require('joi');
const { sequelize, Sequelize } = require('./db');
const countryCode = require('../models/countrycode')(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService');

const getCountryCodes = async (req, res) => {
  try {
    const countryCodes = await countryCode.findAll({ attributes: ['cc_id', 'cc_code', 'cc_name'] });
    return res.status(200).json(countryCodes);
  } catch (err) {
    return res.status(500).json({ message: `Error while fetching country codes ${err.message}` });
  }
};

const createCountryCode = async (req, res, next) => {
  try {
    const schema = Joi.object({
      cc_name: Joi.string().required(),
      cc_code: Joi.string().required()
    });

    const requestBody = req.body;
    const validationResult = schema.validate(requestBody);
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    await countryCode.create({ cc_name: requestBody.cc_name, cc_code: requestBody.cc_code });

    logs
      .addLog({
        log_user_id: req.user.username.user_id,
        log_description: `Log on country code: Added new country code (${requestBody.cc_name})`,
        log_date: new Date()
      })
      .then(() => {
        return res.status(200).json(`Country code ${requestBody.cc_name} was successfully saved in the database`);
      });
  } catch (err) {
    console.error(`Error while creating country code ${err.message}`);
    next(err);
  }
};

const getCountryCodeById = async (req, res) => {
  const cc_id = req.params.id;
  const countryCode = await countryCode.findOne({ where: { cc_id } });
  return res.status(200).json(countryCode);
};

const updateCountryCode = async (req, res, next) => {
  const cc_id = req.params.id;
  try {
    const schema = Joi.object({
      cc_name: Joi.string().required(),
      cc_code: Joi.string().required()
    });

    const requestBody = req.body;
    const validationResult = schema.validate(requestBody);
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    await countryCode.update(
      {
        cc_name: requestBody.cc_name,
        cc_code: requestBody.cc_code
      },
      {
        where: {
          cc_id
        }
      }
    );

    logs
      .addLog({
        log_user_id: req.user.username.user_id,
        log_description: `Log on country code: Updated country code (${requestBody.cc_name})`,
        log_date: new Date()
      })
      .then(() => {
        return res.status(200).json(`Country code ${requestBody.cc_name} changes were successfully saved in the database`);
      });
  } catch (err) {
    console.error(`Error while updating country code ${err.message}`);
    next(err);
  }
};

const findCountryCodeById = async (countryCodeId) => {
  return await countryCode.findOne({ where: { cc_id: countryCodeId } });
};

module.exports = {
  getCountryCodes,
  createCountryCode,
  getCountryCodeById,
  updateCountryCode,
  findCountryCodeById
};
