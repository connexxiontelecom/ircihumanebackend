const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const workExperienceService = require('../services/workExperienceService');

/* work experience provider routes. */

router.post('/',auth(), workExperienceService.addWorkExperience);
router.get('/:id',auth(), workExperienceService.getEmployeeWorkExperienceList);
router.patch('/:id',auth(), workExperienceService.updateWorkExperience);



module.exports = router;
