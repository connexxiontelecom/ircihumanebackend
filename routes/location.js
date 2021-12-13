const express = require('express');
const router = express.Router();
const locationService = require('../services/locationService');

/* location provider routes. */

router.get('/', locationService.getLocations);
router.post('/', locationService.setNewLocation);
router.get('/:id', locationService.getLocationById);
router.patch('/:id', locationService.updateLocation);


module.exports = router;
