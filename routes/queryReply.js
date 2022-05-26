const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const queryReplyService = require('../services/queryReplyService');

/* work query reply provider routes. */

router.post('/',auth(), queryReplyService.replyQuery);
router.get('/:id',auth(), queryReplyService.getAllRepliesByQueryId);



module.exports = router;
