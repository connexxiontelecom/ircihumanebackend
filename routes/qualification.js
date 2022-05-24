const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const qualificationService = require('../services/qualificationService');

/* Pension provider routes. */

router.get('/',auth(), qualificationService.getQualifications);
router.post('/',auth(), qualificationService.setNewQualification);
router.get('/:id',auth(), qualificationService.getQualificationById);
router.patch('/:id',auth(), qualificationService.updateQualification);


module.exports = router;
