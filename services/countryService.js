const {QueryTypes} = require('sequelize')
const {sequelize, Sequelize} = require('./db');
const CountryModel = require("../models/Country")(sequelize, Sequelize.DataTypes)

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
  getCountries,
  getCountryById,
  setNewCountry,
  updateCountry,
  findCountryById
};

