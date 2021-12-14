const express = require('express');
const router = express.Router();
<<<<<<< HEAD
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
=======
>>>>>>> 08d0d01a918c75f48e6a47ab298b22e039144bc4
const locationService = require('../services/locationService');

/* location provider routes. */

router.get('/',auth, locationService.getLocations);
router.post('/',auth, locationService.setNewLocation);
router.get('/:id',auth, locationService.getLocationById);
router.patch('/:id',auth, locationService.updateLocation);


module.exports = router;
