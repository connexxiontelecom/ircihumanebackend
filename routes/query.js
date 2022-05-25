const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const queryService = require('../services/queryService');

/* work query provider routes. */

router.post('/',auth(), queryService.queryEmployee);
router.get('/',auth(), queryService.getAllQueries);
router.get('/employee/:id',auth(), queryService.getAllEmployeeQueries);
router.get('/:id',auth(), queryService.getQuery);



module.exports = router;
