const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const sectorLeadService = require('../services/sectorLeadService');

/* location provider routes. */

router.get('/',auth, sectorLeadService.getSectorLeads);
router.post('/add-new-sector-lead',auth, sectorLeadService.setNewSectorLead);/*
router.get('/:id',auth, sectorLeadService.getLocationById);
router.patch('/:id',auth, sectorLeadService.updateLocation);*/


module.exports = router;
