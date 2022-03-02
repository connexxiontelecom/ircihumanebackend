const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const locationService = require('../services/locationService');

/* location provider routes. */

router.get('/',auth, locationService.getLocations);
router.post('/',auth, locationService.setNewLocation);
router.get('/:id',auth, locationService.getLocationById);
router.patch('/:id',auth, locationService.updateLocation);


module.exports = router;
