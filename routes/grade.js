const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");

const gradeService = require('../services/gradeService');

/* Pension provider routes. */

router.get('/',auth, gradeService.getGrades);
router.post('/',auth, gradeService.setNewGrade);
router.get('/:id',auth, gradeService.getGradeById);
router.patch('/:id',auth, gradeService.updateGrade);


module.exports = router;
