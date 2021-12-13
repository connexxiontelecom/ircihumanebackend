const express = require('express');
const router = express.Router();
const gradeService = require('../services/gradeService');

/* Pension provider routes. */

router.get('/', gradeService.getGrades);
router.post('/', gradeService.setNewGrade);
router.get('/:id', gradeService.getGradeById);
router.patch('/:id', gradeService.updateGrade);


module.exports = router;
