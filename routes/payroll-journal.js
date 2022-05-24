const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const users = require('../services/userService');
const logs = require("../services/logService");
const payrollJournalService = require("../services/payrollJournalService");
const ROLES = require('../roles')
const _ = require('lodash')


/* Get All Users */
router.get('/', auth(), async function (req, res, next) {
    try {

        await payrollJournalService.getAllPayrollJournal().then((data) => {
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while Payroll Journals ${err.message}`)
    }
});


/* Add User */
router.post('/', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            pj_code: Joi.string().required(),
            pj_journal_item: Joi.string().required(),
            pj_location: Joi.number().required(),
        })
        const validationResult = schema.validate(req.body)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollJournalObject = {
            pj_code: req.body.pj_code,
            pj_journal_item: req.body.pj_journal_item,
            pj_location: req.body.pj_location,
            pj_setup_by: req.user.username.user_id,
        }
        const payrollJournalAddResponse = await payrollJournalService.addPayrollJournal(payrollJournalObject).then((data) => {
            return data
        })

        if (_.isEmpty(payrollJournalAddResponse) || _.isNull(payrollJournalAddResponse)) {
            return res.status(400).json('An Error Occurred While adding Payroll')
        }
        return res.status(200).json('Payroll Journal Added Successfully')
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});

router.patch('/', auth(), async function (req, res, next) {
    try {
        const schema = Joi.object({
            pj_id: Joi.number().required(),
            pj_code: Joi.string().required(),
            pj_journal_item: Joi.string().required(),
            pj_location: Joi.number().required(),
        })
        const validationResult = schema.validate(req.body)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const payrollJournalObject = {
            pj_id: req.body.pj_id,
            pj_code: req.body.pj_code,
            pj_journal_item: req.body.pj_journal_item,
            pj_location: req.body.pj_location,
            pj_setup_by: req.user.username.user_id,
        }

        const checkPayrollJournal = await payrollJournalService.getAllPayrollJournal(payrollJournalObject.pj_id).then((data)=>{
            return data
        })

        if(_.isEmpty(checkPayrollJournal) || _.isNull(checkPayrollJournal)){
            return res.status(400).json('Journal code does not exist')
        }
        const payrollJournalAddResponse = await payrollJournalService.updatePayrollJournal(payrollJournalObject).then((data) => {
            return data
        })

        if (_.isEmpty(payrollJournalAddResponse) || _.isNull(payrollJournalAddResponse)) {
            return res.status(400).json('An Error Occurred While adding Payroll')
        }
        return res.status(200).json('Payroll Journal Updated Successfully')
    } catch (err) {
        console.error(`Error while adding user `, err.message);
        next(err);
    }
});

module.exports = router;
