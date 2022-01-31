const express = require('express');
const router = express.Router();
const {parse, stringify, toJSON, fromJSON} = require('flatted');
const {format} = require('date-fns');
const  differenceInBusinessDays = require('date-fns/differenceInBusinessDays')
const isBefore = require('date-fns/isBefore')
const auth = require("../middleware/auth");
const Joi = require('joi');

const travelApplicationService = require('../services/travelApplicationService');
const travelApplicationBreakdownService = require('../services/travelApplicationBreakdownService');
const travelApplicationT2Service = require('../services/travelApplicationT2Service');
const authorizationAction = require('../services/authorizationActionService');
const supervisorAssignmentService = require('../services/supervisorAssignmentService');

/* state routes. */

router.get('/', auth, travelApplicationService.getTravelApplications);
router.get('/my-travel-applications', auth, travelApplicationService.getTravelApplicationsByEmployeeId);

//router.get('/', auth, travelApplicationService.getTravelApplications);
router.post('/new-travel-application', auth, async (req, res)=>{
    try {
        //return res.status(200).json({message: "hello"});
        const schema = Joi.object({
            employee: Joi.number().required(),
            travel_category: Joi.number().required(),
            purpose: Joi.string().required(),
            start_date: Joi.string().required(),
            end_date: Joi.string().required(),
            t1_code: Joi.string().required(),
            hotel: Joi.number().required(),
            city: Joi.string().allow(null, ''),
            currency: Joi.string().allow(null, ''),
            per_diem: Joi.number().allow(null, ''),
            total: Joi.number().allow(null, ''),
            arrival_date: Joi.string().allow(null, ''),
            departure_date: Joi.string().allow(null, ''),
            preferred_hotel: Joi.string().allow(null, ''),

            //t2_code: Joi.array().items(Joi.string()).allow(null).allow(''),

            breakdown: Joi.array().items(Joi.object({
                depart_from:Joi.string().required(),
                actual_date:Joi.string().required(),
                means:Joi.number().required(),
                prompt:Joi.number().required(),
                destination:Joi.string().required()
            })),
        });
        const travelRequest = req.body
        const validationResult = schema.validate(travelRequest)

        if(validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message);
        }
        if(req.body.travel_category === 1){
            const tc_schema = Joi.object({
                per_diem: Joi.number().required(),
                t2_code: Joi.array().items(Joi.object({
                    code: Joi.string().required()
                }))
            });
            const tcRequest = req.body;
            const validateTC = tc_schema.validate(tcRequest);
            if(validateTC.error){
                return res.status(400).json(validateTC.error.details[0].message);
            }
        }
        if(req.body.hotel === 1){
            const h_schema = Joi.object({
                city: Joi.string().required(),
                arrival_date: Joi.string().required(),
                departure_date: Joi.string().required(),
                preferred_hotel: Joi.string().required(),

            });
            const hRequest = req.body;
            const validateH = h_schema.validate(hRequest);
            if(validateH.error){
                return res.status(400).json(validateH.error.details[0].message);
            }
        }


        const { start_date, end_date } = req.body;
        let startDate = new Date(start_date);
        let startYear = startDate.getFullYear();
        let endDate = new Date(end_date);
        let endYear = endDate.getFullYear();
        if(isBefore(startDate, new Date())) return res.status(400).json({message:"Your start date cannot be before today."});
        if(isBefore(endDate, new Date())) return res.status(400).json({message:"Your end date cannot be before today."});
        if(String(startYear) === String(endYear)){
            let daysRequested =  await differenceInBusinessDays(endDate, startDate);
            if(parseInt(daysRequested) >= 1) {
                travelApplicationService.setNewTravelApplication(travelRequest, daysRequested).then((data) => {
                    const travelapp_id = data.travelapp_id;
                    try {
                        const breakdowns = req.body.breakdown;
                        breakdowns.map((breakdown) => {
                            travelApplicationBreakdownService.setNewTravelApplicationBreakdown(breakdown, travelapp_id);
                        });
                        if (req.body.travel_category === 1) {

                        const t2CodeArray = req.body.t2_code;
                        t2CodeArray.map((t2Data) => {
                            travelApplicationT2Service.setNewTravelApplicationT2(travelapp_id, t2Data.code)
                        });
                    }
                    }catch (e) {
                        return res.status(400).json({message:"Something went wrong. Try again."});
                    }
                    //Register authorization
                    authorizationAction.registerNewAction(3,travelapp_id, 2,0,"Travel application initialized.");
                    return res.status(200).json({message: 'Your travel application was successfully registered.'});
                });
            }else{
                return  res.status(400).json({message: 'Travel duration must be greater or equal to 1'});
            }
        }else{
            return  res.status(400).json({message: 'Travel period must be within the same year'})
        }

    }catch (e) {
        return res.status(400).json({message:`Something went wrong. Inspect and try again. Error: ${e.message}`});
    }
});

router.get('/get-travel-application/:id', auth, (req, res)=>{
    const employee = req.params.id
    try{
        const tRequests = travelApplicationService.getTravelApplicationsByEmployeeId(employee);
        return res.status(200).json({applications:tRequests});
    }catch (e) {
        return res.status(400).json({message: "Something went wrong. Try again."});
    }
});

module.exports = router;
