const Joi = require('joi');
const { sequelize, Sequelize } = require('./db');
const countryCode = require('../models/countrycode')(sequelize, Sequelize.DataTypes);
const CountryModel = require("../models/country")(sequelize, Sequelize.DataTypes)
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



const errHandler = (err) => {
  console.log('Error:', err);
};

/**
 * Fetch all countries
 */
const getCountries = async (req, res) => {
  try {
    const countries = await CountryModel.findAll({
      attributes: [
        'id',
        'iso',
        'name',
        'nicename',
        'iso3',
        'numcode',
        'phonecode',
        'flag'
      ],
      order: [['name', 'ASC']]
    });
    res.status(200).json(countries);
  } catch (e) {
    console.error('Error fetching countries:', e);
    res.status(500).json({ message: 'Something went wrong. Try again later' });
  }
};

/**
 * Get a country by ID
 */
const getCountryById = async (req, res) => {
  const countryId = req.params.id;
  try {
    const country = await CountryModel.findOne({ where: { id: countryId } });
    if (!country) return res.status(404).json({ message: 'Country not found' });
    return res.status(200).json(country);
  } catch (e) {
    console.error('Error fetching country:', e);
    return res.status(500).json({ message: 'Something went wrong. Try again later' });
  }
};

/**
 * Add a new country
 */
const setNewCountry = async (req, res) => {
  try {
    const schema = Joi.object({
      iso: Joi.string().required(),
      name: Joi.string().required(),
      nicename: Joi.string().required(),
      iso3: Joi.string().allow(null, ''),
      numcode: Joi.string().allow(null, ''),
      phonecode: Joi.string().allow(null, ''),
      flag: Joi.string().allow(null, '')
    });

    const countryRequest = req.body;
    const validationResult = schema.validate(countryRequest);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const newCountry = await CountryModel.create({
      iso: req.body.iso,
      name: req.body.name,
      nicename: req.body.nicename,
      iso3: req.body.iso3,
      numcode: req.body.numcode,
      phonecode: req.body.phonecode,
      flag: req.body.flag
    }).catch(errHandler);

    // Log
    const logData = {
      log_user_id: req.user?.username?.user_id || null,
      log_description: `Added a new country (${req.body.name})`,
      log_date: new Date()
    };

    logs.addLog(logData).then(() => {
      return res.status(200).json(`New country ${req.body.name} was successfully saved.`);
    });
  } catch (e) {
    console.error('Error adding country:', e);
    return res.status(400).json('Error while adding country');
  }
};

/**
 * Update existing country
 */
const updateCountry = async (req, res) => {
  try {
    const schema = Joi.object({
      iso: Joi.string().required(),
      name: Joi.string().required(),
      nicename: Joi.string().required(),
      iso3: Joi.string().allow(null, ''),
      numcode: Joi.string().allow(null, ''),
      phonecode: Joi.string().allow(null, ''),
      flag: Joi.string().allow(null, '')
    });

    const validationResult = schema.validate(req.body);
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const countryId = req.params.id;
    await CountryModel.update(
      {
        iso: req.body.iso,
        name: req.body.name,
        nicename: req.body.nicename,
        iso3: req.body.iso3,
        numcode: req.body.numcode,
        phonecode: req.body.phonecode,
        flag: req.body.flag
      },
      { where: { id: countryId } }
    ).catch(errHandler);

    // Log
    const logData = {
      log_user_id: req.user?.username?.user_id || null,
      log_description: `Updated country (${req.body.name})`,
      log_date: new Date()
    };

    logs.addLog(logData).then(() => {
      return res.status(200).json(`Country ${req.body.name} updated successfully.`);
    });
  } catch (e) {
    console.error('Error updating country:', e);
    return res.status(400).json('Error while updating country');
  }
};

/**
 * Find country by ID (used internally)
 */
async function findCountryById(countryId) {
  return await CountryModel.findOne({ where: { id: countryId } });
}




module.exports = {
  getCountryCodes,
  createCountryCode,
  getCountryCodeById,
  updateCountryCode,
  findCountryCodeById,
  getCountries,
  getCountryById,
  setNewCountry,
  updateCountry,
  findCountryById
};
