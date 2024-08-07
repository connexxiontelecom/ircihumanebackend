const { QueryTypes } = require('sequelize');
const { sequelize, Sequelize } = require('./db');
const location = require('../models/Location')(sequelize, Sequelize.DataTypes);
const State = require('../models/State')(sequelize, Sequelize.DataTypes);
const hrFocalPointModel = require('../models/hrfocalpoint')(sequelize, Sequelize.DataTypes);
const Joi = require('joi');
const logs = require('../services/logService');
const helper = require('../helper');
const errHandler = (err) => {
  console.log('Error: ', err);
};
const getLocations = async (req, res, next) => {
  try {
    const locations = await location.findAll({
      attributes: ['location_name', 'location_id', 'l_t6_code', 'l_state_id'],
      include: [State]
    });
    res.status(200).json(locations);
  } catch (e) {
    res.status(400).json({ message: `Error while fetching locations ${e.message}` });
    //next(e);
  }
};
const setNewLocation = async (req, res, next) => {
  try {
    const schema = Joi.object({
      location_name: Joi.string().required(),
      location_state: Joi.number().required(),
      location_t6_code: Joi.string().required(),
      focal_points: Joi.array().required()
    });
    const locationRequest = req.body;
    const validationResult = schema.validate(locationRequest);
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const data = {
      location_name: req.body.location_name,
      l_state_id: req.body.location_state,
      l_t6_code: req.body.location_t6_code
    };

    const loc = await location.addLocation(data);
    const focal_points = req.body.focal_points;
    focal_points.map((point) => {
      let fp = {
        hfp_location_id: loc.location_id,
        hfp_emp_id: point.value
      };
      hrFocalPointModel.addHrFocalPoint(fp);
    });

    //Log
    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Log on location: Added location (${req.body.location_name})`,
      log_date: new Date()
    };
    logs.addLog(logData).then((logRes) => {
      return res.status(200).json(`New location :  ${req.body.location_name} was successfully saved in the database`);
    });
  } catch (e) {
    console.error(`Error while adding location `, e.message);
    next(e);
  }
};
const getLocationById = async (req, res) => {
  try {
    const location_id = req.params.id;
    const loc = await location.findOne({ where: { location_id: location_id } });
    return res.status(200).json(loc);
  } catch (e) {
    return res.status(400).json('Something went wrong.');
  }
};
const updateLocation = async (req, res, next) => {
  try {
    const schema = Joi.object({
      location_name: Joi.string().required(),
      location_state: Joi.number().required(),
      location_t6_code: Joi.string().required(),
      focal_points: Joi.array().required()
    });
    const locationRequest = req.body;
    const validationResult = schema.validate(locationRequest);
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const location_id = req.params.id;
    const loca = await location.update(
      {
        location_name: req.body.location_name,
        l_t6_code: req.body.location_t6_code,
        l_state_id: req.body.location_state
      },
      {
        where: {
          location_id: location_id
        }
      }
    );
    const focal_points = req.body.focal_points;
    const hrpoints = await hrFocalPointModel.getHrFocalPointsByLocationId(location_id);
    const existing = [];
    hrpoints.map((lin) => {
      existing.push(lin.hfp_emp_id);
    });
    if (existing.length > 0) {
      const destroyEx = await hrFocalPointModel.destroyHrFocalPoints(location_id, existing);
    }
    focal_points.map((point) => {
      let fp = {
        hfp_location_id: location_id, //loca.location_id,
        hfp_emp_id: point.value
      };
      hrFocalPointModel.addHrFocalPoint(fp);
    });
    //Log
    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Log on location: Update on location (${req.body.location_name})`,
      log_date: new Date()
    };
    logs.addLog(logData).then((logRes) => {
      return res.status(200).json(`Your changes on :  ${req.body.location_name} was successfully saved in the database`);
    });
  } catch (e) {
    console.error(`Error while adding location `, e.message);
    next(e);
  }
};

async function findLocationById(locationId) {
  return await location.findOne({ where: { location_id: locationId } });
}

async function findAllLocations() {
  return await location.findAll();
}

module.exports = {
  getLocationById,
  getLocations,
  updateLocation,
  setNewLocation,
  findLocationById,
  findAllLocations
};
