const express = require('express');
const router = express.Router();

const qualificationService = require('../services/qualificationService');

/* Pension provider routes. */

router.get('/', qualificationService.getQualifications);
router.post('/', qualificationService.setNewQualification);
router.get('/:id', qualificationService.getQualificationById);
router.patch('/:id', qualificationService.updateQualification);


module.exports = router;
