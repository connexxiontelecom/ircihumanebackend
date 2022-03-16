const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const logs = require('../services/logService')
const authorizationRoleService = require('../services/authorizationRoleService')


router.get('/:typeId', auth, async function (req, res, next) {
    try {
        const typeId = parseInt(req.params.typeId);

        await authorizationRoleService.getAllAuthorizationRolesByType(typeId).then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`We couldn't fetch authorization roles at the moment. Try again`)
    }
});

router.get('/', auth, async function (req, res, next) {
    try {

        await authorizationRoleService.getAllAuthorizationRoles().then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`We couldn't fetch authorization roles at the moment. Try again`)
    }
});

router.post('/', async (req, res) => {
    try {
        const schema = Joi.object({
            title: Joi.string().required(),
            type: Joi.number().required(),

        });

        const authRequest = req.body
        const validationResult = schema.validate(authRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        authorizationRoleService.addAuthorizationRole(authRequest).then((data) => {
            return res.status(201).json("New authorization role added.");
        })
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});

router.patch('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const schema = Joi.object({
            title: Joi.string().required(),
            type: Joi.number().required(),

        });

        const authRequest = req.body
        const validationResult = schema.validate(authRequest)
        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        authorizationRoleService.updateAuthorizationRole(authRequest, id).then((data) => {
            return res.status(200).json("Role updated");
        })
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again.");
    }
});

router.get('/:id', auth, async function (req, res) {
    try {
        const id = req.params.id;
        await authorizationRoleService.getAuthorizationRoleById(parseInt(id)).then((data) => {
            return res.status(200).json(data);
        })
    } catch (err) {
        return res.status(400).json(`Something went wrong. Try again.`)
    }
});


module.exports = router;
