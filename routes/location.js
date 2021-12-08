const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');

const locationService = require('../services/locationService');

/* Pension provider routes. */

router.get('/', locationService.getLocations);
router.post('/', locationService.setNewLocation);
router.get('/:id', locationService.getLocationById);
router.patch('/:id', locationService.updateLocation);


module.exports = router;
