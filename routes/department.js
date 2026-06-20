const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const auth = require("../middleware/auth");
const departmentService = require('../services/departmentService');
const enforceAuthorizationService = require('../services/enforceAuthorizationService');
const Joi = require('joi');

/* Department routes. */

router.get('/enforce-authorization/status', auth(), async (req, res) => {
  try {
    const status = await enforceAuthorizationService.getEnforceAuthorizationStatus();
    return res.status(200).json(status);
  } catch (e) {
    return res.status(400).json(`Unable to load enforce authorization setting. ${e.message}`);
  }
});

router.put('/enforce-authorization', auth(), async (req, res) => {
  try {
    const permissions = req.user?.username?.permission || [];
    const userType = parseInt(req.user?.username?.user_type, 10);

    if (
      userType !== 1 &&
      userType !== 3 &&
      !permissions.includes('HR_CONFIG')
    ) {
      return res.status(401).json('Unauthorised');
    }

    const schema = Joi.object({
      enforce: Joi.boolean().required()
    });

    const validationResult = schema.validate(req.body, { abortEarly: false });
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }

    const userId = req.user?.username?.user_id;
    const status = await enforceAuthorizationService.setEnforceAuthorization(
      validationResult.value.enforce,
      userId
    );

    return res.status(200).json(status);
  } catch (e) {
    return res.status(400).json(`Unable to update enforce authorization setting. ${e.message}`);
  }
});

router.get('/', auth(), departmentService.getDepartments);
router.post('/', auth(), departmentService.setNewDepartment);
router.get('/:id', auth(), departmentService.getDepartmentById);
router.patch('/:id', auth(), departmentService.updateDepartment);


module.exports = router;
