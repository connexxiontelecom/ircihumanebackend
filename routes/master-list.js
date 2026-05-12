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
    let masterLists = null;
    if(parseInt(req.body.location_id) === 0){
       masterLists = await masterListService.getMasterListFromAllLocations(req.body.month, req.body.year, req.body.sub_category);
    }else{
       masterLists = await masterListService.getMasterList(req.body.month, req.body.year, req.body.location_id, req.body.sub_category);
    }
    return res.status(200).json(masterLists);
  } catch (err) {
    console.error(`Error while adding user `, err.message);
    next(err);
  }
});

module.exports = router;
//SELECT * FROM `leave_applications` WHERE leapp_start_date BETWEEN '2024-04-11' AND '2024-04-12';
//SELECT * FROM `leave_accruals` WHERE lea_leaveapp_id IN(6937, 7267,7373,7383,7418,7422,7425,7438,7444,7462,7506,7507,7513,7516,7522);
