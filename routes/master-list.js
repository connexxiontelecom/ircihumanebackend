const Joi = require('joi');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const logs = require('../services/logService');
const payrollJournalService = require('../services/payrollJournalService');
const masterListService = require('../services/master_list_service');

router.post('/', auth(), async function (req, res, next) {
  try {
    const schema = Joi.object({
      month: Joi.string().required(),
      year: Joi.string().required(),
      location_id: Joi.number().required(),
      sub_category: Joi.number().required()
    });
    const validationResult = schema.validate(req.body);

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const masterLists = await masterListService.getMasterList(req.body.month, req.body.year, req.body.location_id, req.body.sub_category);

    return res.status(200).json(masterLists);
  } catch (err) {
    console.error(`Error while adding user `, err.message);
    next(err);
  }
});

module.exports = router;
