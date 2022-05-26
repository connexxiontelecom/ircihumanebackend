const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const lgaService = require('../services/LocalGovernmentService');

/* location provider routes. */

//router.get('/',auth(), locationService.getLocations);
router.post('/',auth(), lgaService.addLga);
router.get('/:id',auth(), lgaService.getLocalGovernmentByStateId);
router.get('/',auth(), lgaService.getLocalGovernments);
router.patch('/:id',auth(), lgaService.updateLocalGovernment);


module.exports = router;
