const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require('../middleware/auth');
const queryReplyService = require('../services/queryReplyService');
const queryService = require("../services/queryService");

/* work query reply provider routes. */

router.post('/',auth(), queryReplyService.replyQuery);
router.get('/:id',auth(), queryReplyService.getAllRepliesByQueryId);

router.post('/query-reply-doc/:replyId', auth(), queryReplyService.uploadQueryReplyFiles);

module.exports = router;
