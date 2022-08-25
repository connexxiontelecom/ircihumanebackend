const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const publicHolidays = require('../services/publicHolidayServiceSetup');

/* public holiday provider routes. */

router.get('/', auth(), publicHolidays.getAllPublicHolidays);
router.get('/year/current', auth(), publicHolidays.getCurrentYearPublicHolidays);
router.get('/holiday', auth(), publicHolidays.getAllIndividualPublicHolidays);
router.post('/add-public-holiday',auth(), publicHolidays.setNewPublicHoliday);
router.patch('/:id',auth(), publicHolidays.updatePublicHoliday);
//router.get('/group/:id',auth(), publicHolidays.deletePublicHolidayByGroup);
router.get('/group/:id',auth(), publicHolidays.archivePublicHolidayByGroup);


module.exports = router;


