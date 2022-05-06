const Joi = require('joi')
const _ = require('lodash')
const express = require('express')
const router = express.Router()
const auth = require("../middleware/auth");
const rating = require('../services/ratingService')
const logs = require('../services/logService')


/* Get all Ratings */
router.get('/', auth, async function (req, res, next) {
    try {

        rating.findAllRating().then((data) => {
            return res.status(200).json(data)
        })

    } catch (err) {

        console.log(err.message)

        next(err);
    }
});


/* Add to Rating */
router.post('/add-rating', auth, async function (req, res, next) {
    try {
        const schema = Joi.object({
            rating_name: Joi.string().required(),
            rating_desc: Joi.string().allow(null),
            rating_period: Joi.number().required(),
        })

        const ratingRequest = req.body
        const validationResult = schema.validate(ratingRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        await rating.findRatingByName(ratingRequest.rating_name).then((data) => {
            if (_.isEmpty(data) || _.isNull(data)) {
                rating.addRating(ratingRequest).then((data) => {
                    if (_.isEmpty(data) || _.isNull(data)) {
                        return res.status(400).json(`An Error Occurred while adding Rating`)
                    } else {
                        const logData = {
                            "log_user_id": req.user.username.user_id,
                            "log_description": "Added New Rating",
                            "log_date": new Date()
                        }
                        logs.addLog(logData).then((logRes) => {
                            return res.status(200).json('Action Successful')
                        })

                    }
                })

            } else {
                return res.status(400).json(`Rating Already Exists`)
            }
        })

    } catch (err) {
        console.error(`Error while adding rating `, err.message);
        next(err);
    }
});

/* Update Salary Rating */
router.patch('/update-rating/:rating_id', auth, async function (req, res, next) {
    try {
        const ratingId = req.params.rating_id
        const schema = Joi.object({
            rating_name: Joi.string().required(),
            rating_desc: Joi.string().required(),
        })

        const ratingRequest = req.body
        const validationResult = schema.validate(ratingRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        await rating.findRating(ratingId).then((data) => {
            if (_.isEmpty(data) || _.isNull(data)) {
                return res.status(400).json(`Rating Does Not Exists`)
            } else {
                rating.findRatingByName(ratingRequest.rating_name).then((data) => {
                    if (_.isEmpty(data) || _.isNull(data)) {
                        rating.updateRating(ratingId, ratingRequest).then((data) => {
                            if (_.isEmpty(data) || _.isNull(data)) {
                                return res.status(400).json(`An Error Occurred while Updating Rating`)
                            } else {

                                const logData = {
                                    "log_user_id": req.user.username.user_id,
                                    "log_description": "Updated Rating",
                                    "log_date": new Date()
                                }
                                logs.addLog(logData).then((logRes) => {
                                    return res.status(200).json('Action Successful')
                                })


                            }
                        })

                    } else {
                        if (parseInt(data.rating_id) === parseInt(ratingId)) {
                            rating.updateRating(ratingId, ratingRequest).then((data) => {
                                if (_.isEmpty(data) || _.isNull(data)) {
                                    return res.status(400).json(`An Error Occurred while Updating Rating`)
                                } else {

                                    const logData = {
                                        "log_user_id": req.user.username.user_id,
                                        "log_description": "Updated Rating",
                                        "log_date": new Date()
                                    }
                                    logs.addLog(logData).then((logRes) => {
                                        return res.status(200).json('Action Successful')
                                    })

                                }
                            })
                        } else {
                            return res.status(400).json(`Rating Already Exists`)
                        }


                    }
                })

            }

        })


    } catch (err) {
        console.error(`Error while adding time sheet `, err.message);
        next(err);
    }
});

router.patch('/update-end-year-rating-status/:rating_id', auth, async function (req, res, next) {
  try {
    const ratingId = req.params.rating_id
    const schema = Joi.object({
      rating_status: Joi.number().required(),
    })

    const ratingRequest = req.body
    const validationResult = schema.validate(ratingRequest)

    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message)
    }
    await rating.findRating(ratingId).then((data) => {
      if (_.isEmpty(data) || _.isNull(data)) {
        return res.status(400).json(`Rating Does Not Exists`)
      } else {
            rating.updateRatingStatus(ratingId, ratingRequest).then((data) => {
              if (_.isEmpty(data) || _.isNull(data)) {
                return res.status(400).json(`An Error Occurred while Updating Rating`)
              } else {

                const logData = {
                  "log_user_id": req.user.username.user_id,
                  "log_description": "Updated Rating",
                  "log_date": new Date()
                }
                logs.addLog(logData).then((logRes) => {
                  return res.status(200).json('Action Successful')
                })


              }
            })

      }

    })


  } catch (err) {
    return res.status(400).json(`Error while adding time sheet `);
    next(err);
  }
});

router.get('/get-end-ratings/:rating_id/:period', auth, async function(req, res){
  try{

  }catch (e) {

  }
});

router.get('/get-end-ratings/:rating_id/:period', auth, async function(req, res){
  try{

  }catch (e) {
//endpoints :
    /*
     * 1. for updating the status of a rating by taking the ID.
     */

  }
});

module.exports = router;
