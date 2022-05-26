const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const educationService = require('../services/educationService');

/* education provider routes. */

router.post('/',auth(), educationService.addEducation);
router.get('/:id',auth(), educationService.getEmployeeEducationList);
router.patch('/:id',auth(), educationService.updateEducation);



module.exports = router;
