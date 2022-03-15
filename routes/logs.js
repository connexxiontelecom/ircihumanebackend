const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const logs = require('../services/logService');


/* Get All Logs */
router.get('/', auth, async function (req, res, next) {
    try {

        await logs.findAllLogs().then((data) => {
            return res.status(200).json(data);

        })
    } catch (err) {
        return res.status(400).json(`Error while fetching logs ${err.message}`)
    }
});


/* Add User */
router.post('/add-log', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            log_user_id: Joi.string().required(),
            log_description: Joi.string().required(),
            log_date: Joi.string().required(),
        })

        const log = req.body
        const validationResult = schema.validate(log)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await logs.addLog(log).then((data) => {
            return res.status(200).json(data)
        })

    } catch (err) {
        console.error(`Error while log user `, err.message);
        next(err);
    }
});

/* UpdateUser */
router.patch('/update-user/:user_id', auth, async function (req, res, next) {
    try {

        const schemaWithoutPassword = Joi.object({
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
        })

        const schemaWithPassword = Joi.object({
            user_username: Joi.string().min(5).required(),
            user_name: Joi.string().min(5).required(),
            user_email: Joi.string().email().required(),
            user_password: Joi.string().min(5).required(),
            user_password_repeat: Joi.ref('user_password'),
            user_type: Joi.number().required(),
            user_token: Joi.string().min(2),
            user_status: Joi.number().required(),
        })

        const user = req.body

        let validationResult;
        if (user.user_password) {
            validationResult = schemaWithPassword.validate(user)
        } else {
            validationResult = schemaWithoutPassword.validate(user)
        }

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }


        await users.findUserByUserId(req.params['user_id']).then((data) => {
            if (data) {
                users.updateUser(user, req.params['user_id']).then((data) => {
                    return res.status(200).json(`User updated ${data}`)
                })


            } else {
                return res.status(404).json('User does not exist in database')
            }
        })
    } catch (err) {

        console.error(`Error while updating user `, err.message);
        next(err);
    }
});

/* Login User */
router.post('/login', async function (req, res, next) {
    try {
        const user = req.body
        await users.findUserByUsername(user.user_username).then((data) => {
            if (data) {
                if (parseInt(data.user_status) === 1) {
                    bcrypt.compare(user.user_password, data.user_password, function (err, response) {
                        if (err) {
                            return res.status(400).json(`${err} occurred while logging in`)
                        }
                        if (response) {
                            let token = generateAccessToken(data)
                            return res.status(200).json(token);
                        } else {
                            return res.status(400).json('Incorrect Password')
                        }
                    })
                } else {
                    return res.status(400).json('User Account Suspended')
                }

            } else {
                return res.status(404).json('Invalid Username')
            }
        })
    } catch (err) {
        return res.status(400).json(`Error while logging user ${err.message}`)
    }
});

function generateAccessToken(username) {
    return jwt.sign({username}, process.env.TOKEN_SECRET, {expiresIn: '18000s'});
}


module.exports = router;
