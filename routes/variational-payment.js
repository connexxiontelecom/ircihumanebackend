const Joi = require('joi')
const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");
const _ = require('lodash')
const variationalPayment = require('../services/variationalPaymentService');
const variationalPaymentDocument = require('../services/variationalDocumentsService');
const paymentDefinition = require('../services/paymentDefinitionService');
const payrollMonthYear = require('../services/payrollMonthYearService');
const timesheetPenaltyService = require('../services/timesheetPenaltyService');
const timesheetPenaltyModel = require('../models/TimeSheetPenalty');
const employees = require('../services/employeeService');
const logs = require('../services/logService')
const salary = require("../services/salaryService");
const {sequelize} = require("../services/db");
const documents = require("../services/employeeDocumentsService");
const payrollMonthYearLocation = require('../services/payrollMonthYearLocationService')
const path = require("path");
const AWS = require("aws-sdk");
const {removePayrollMonthYearLocation} = require("../services/payrollMonthYearLocationService");
const s3 = new AWS.S3({
  accessKeyId: `${process.env.ACCESS_KEY}`,
  secretAccessKey: `${process.env.SECRET_KEY}`
});


/* Get All variational payments */
router.get('/', auth(), async function (req, res, next) {
  try {
    await variationalPayment.getVariationalPayments().then((data) => {
      return res.status(200).json(data);
    })
  } catch (err) {
    return res.status(400).json(`Error while fetching variational payments`)
  }
});


router.post('/', auth(), async (req, res, next) => {
  try {
    // const scheme = Joi.array().items(Joi.object().keys({
    //     name: Joi.string().required(),
    //     value: Joi.required()
    // }).unknown(true)).unique((a, b) => a.name === b.name)
    //
    //
    // const schema = Joi.object({
    //     employee: Joi.array().items(Joi.number().required()),
    //     payment_definition:Joi.number().required(),
    //     amount:Joi.number().required(),
    //     month:Joi.number().required(),
    //     year:Joi.number().required()
    // });

    const vpRequest = req.body
    //const validationResult = schema.validate(vpRequest)
    // if(validationResult.error) {
    //     return res.status(400).json(validationResult.error.details[0].message);
    // }

    //return  res.status(200).json(vpRequest)



    let employeeId = req.body.employee
    let payments = req.body.payments
    //let docs = req.files.documents
    //return res.status(200).json(payments)

    const employeeData = await employees.getEmployee(employeeId).then((data) => {
      return data
    })
    if (!(_.isNull(employeeData) || _.isEmpty(employeeData))) {

      let salaryRoutine = await  removePayrollMonthYearLocation(parseInt(req.body.month), parseInt(req.body.year), parseInt(employeeData.emp_location_id) ).then((data)=>{
        return data
      })

      if(_.isNull(salaryRoutine) || _.isEmpty(salaryRoutine)){
        for (const payment of payments) {
          const checkExisting = await variationalPayment.checkDuplicateEntry(parseInt(employeeId), parseInt(req.body.year), parseInt(req.body.month), parseInt(payment.payment_definition)).then((data) => {
            return data
          })

          if (!(_.isNull(checkExisting) || _.isEmpty(checkExisting))) {
            if ((parseInt(checkExisting.vp_confirm) === 0) || (parseInt(checkExisting.vp_confirm) === 2)) {
              await variationalPayment.deletePaymentEntry(checkExisting.vp_id).then()
            } else {

              return res.status(400).json(`${checkExisting.payment.pd_payment_name} already actioned for employee, consider updating`)
            }

          }

          if (parseFloat(payment.amount) !== 0) {
            const vpObject = {
              vp_emp_id: parseInt(employeeId),
              vp_payment_def_id: parseInt(payment.payment_definition),
              vp_amount: parseFloat(payment.amount),
              vp_payment_month: parseInt(req.body.month),
              vp_payment_year: parseInt(req.body.year)
            }
            const addVariationalPaymentResponse = await variationalPayment.setNewVariationalPayment(vpObject).then((data) => {
              return data
            })

            if (_.isEmpty(addVariationalPaymentResponse) || _.isNull(addVariationalPaymentResponse)) {

              const removePayments = await variationalPayment.deletePaymentEntryEmployeeMonthYear(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
                return data
              })

              return res.status(400).json('An error Occurred while adding variational Payments')

            }
          }


        }


        // if (Array.isArray(docs)) {
        //
        //     for (const doc of docs) {
        //         const uploadResponse = await uploadFile(doc).then((response) => {
        //             return response
        //         })
        //
        //         if (_.isEmpty(uploadResponse)){
        //             let removeResponse = variationalPaymentDocument.deletePaymentDocument(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //                 return data
        //             })
        //             const removePayments = await variationalPayment.deletePaymentEntryEmployeeMonthYear(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //                 return data
        //             })
        //
        //             return res.status(400).json('An error Occurred while Uploading Documents')
        //
        //         }
        //
        //         const documentData = {
        //             vd_emp_id: employeeId,
        //             vd_month: parseInt(req.body.month),
        //             vd_year: parseInt(req.body.year),
        //             vd_doc: uploadResponse
        //         }
        //         let documentAddResponse = await variationalPaymentDocument.setNewVariationalDocument(documentData).then((data) => {
        //             return data
        //         })
        //         if (_.isEmpty(documentAddResponse) || _.isNull(documentAddResponse)) {
        //
        //             let removeResponse = variationalPaymentDocument.deletePaymentDocument(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //                 return data
        //             })
        //             const removePayments = await variationalPayment.deletePaymentEntryEmployeeMonthYear(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //                 return data
        //             })
        //
        //             return res.status(400).json('An error Occurred while Uploading Documents')
        //
        //
        //         }
        //
        //     }
        // }
        // else {
        //     const uploadResponse = await uploadFile(docs).then((response) => {
        //         return response
        //     }).catch(err => {
        //         return res.status(400).json(err)
        //     })
        //
        //     if (_.isEmpty(uploadResponse)) {
        //         let removeResponse = variationalPaymentDocument.deletePaymentDocument(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //             return data
        //         })
        //         const removePayments = await variationalPayment.deletePaymentEntryEmployeeMonthYear(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //             return data
        //         })
        //
        //         return res.status(400).json('An error Occurred while Uploading Documents')
        //
        //     }
        //     const documentData = {
        //         vd_emp_id: employeeId,
        //         vd_month: parseInt(req.body.month),
        //         vd_year: parseInt(req.body.year),
        //         vd_doc: uploadResponse
        //     }
        //
        //     let documentAddResponse = await variationalPaymentDocument.setNewVariationalDocument(documentData).then((data) => {
        //         return data
        //     })
        //     if (_.isEmpty(documentAddResponse) || _.isNull(documentAddResponse)) {
        //         let removeResponse = variationalPaymentDocument.deletePaymentDocument(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //             return data
        //         })
        //         const removePayments = await variationalPayment.deletePaymentEntryEmployeeMonthYear(employeeId, parseInt(req.body.month), parseInt(req.body.year)).then((data) => {
        //             return data
        //         })
        //
        //         return res.status(400).json('An error Occurred while Uploading Documents')
        //
        //
        //     }
        //     return res.status(200).json('Action Successful')
        // }

        return res.status(200).json('Action Successful')
      } else{
        return res.status(400).json("Payroll Routine already run for this location for this period");
      }

      //return res.status(400).json(employeeData);



    } else {
      return res.status(404).json('Employee Does not Exists')
    }



  } catch (e) {
    return res.status(400).json(`Error while posting variational payment  ${e.message}`);
  }
});

router.post('/single-payment', auth(), async (req, res) => {
  try {
    const requestBody = req.body;
    const payroll = await payrollMonthYear.findPayrollMonthYear().then((res) => {
      return res;
    });

    if (_.isEmpty(payroll) || _.isNull(payroll)) {
      return res.status(400).json("There's currently no payroll year record");
    }
    const salaryRoutineCheck = await salary.getSalaryMonthYear(parseInt(payroll.pym_month), parseInt(payroll.pym_year)).then((data) => {
      return data
    });

    if (!(_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck))) {
      return res.status(400).json(`Payroll Routine has already been run`)
    }

    const existingRecord = await variationalPayment.getVariationalPaymentMonthYear(parseInt(payroll.pym_month), parseInt(payroll.pym_year), requestBody.employee, parseInt(requestBody.default_id)).then((r) => {
      return r;
    });
    if (existingRecord) {
      return res.status(400).json("There's an existing record in variational payment");
    }

    const payment = {
      vp_emp_id: parseInt(requestBody.employee),
      vp_payment_def_id: parseInt(requestBody.default_id),
      vp_amount: requestBody.amount,
      vp_payment_month: parseInt(payroll.pym_month), //parseInt(requestBody.month),
      vp_payment_year: parseInt(payroll.pym_year), //parseInt(requestBody.year)
      vp_default_id: 1,
    }

    const val = await variationalPayment.setNewSingleVariationalPayment(payment).then((data) => {
      return data;
    });


    if (_.isEmpty(val) || _.isNull(val)) {
      return res.status(400).json("Something went wrong (adding variational payment).");
    }

    const upTsp = await timesheetPenaltyService.updateTimeSheetPenaltyMonthYearEmpIdStatus(parseInt(requestBody.employee), parseInt(payroll.pym_month), parseInt(payroll.pym_year), 1).then((res) => {
      return res;
    });

    if (_.isNull(upTsp) || _.isEmpty(upTsp)) {
      const deleteResponse = variationalPayment.deletePaymentEntry(val.vp_id).then((data) => {
        return data
      })
      return res.status(400).json("Something went wrong (updating timesheet).");
    }

    res.status(200).json("Action successful.");
  } catch (e) {
    return res.status(400).json("Something went wrong.");
  }
});

router.get('/:id', auth(), async (req, res, next) => {
  try {
    const id = req.params.id;
    variationalPayment.getVariationalPaymentById(id).then((data) => {
      return res.status(200).json(data);
    })
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.');
  }
});

router.post('/confirm-payment', auth(), async (req, res, next) => {
  try {
    const schema = Joi.object({
      status: Joi.number().required(),
      variational_payment: Joi.array().items(Joi.number().required()),
    });
    const vpRequest = req.body
    const validationResult = schema.validate(vpRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    let payments = req.body.variational_payment
    let status = req.body.status
    for (const payment of payments) {
      const vp = await variationalPayment.getVariationalPaymentById(payment).then((data) => {
        return data;
      });
      if (!(_.isNull(vp) || _.isEmpty(vp))) {
        const userId = req.user.username.user_id
        await variationalPayment.updateVariationalPaymentStatus(payment, status, userId).then()
      }
    }
    return res.status(200).json('Action Successful');
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.' + e.message);
  }
});

router.get('/current-payment/:year/:month', auth(), async (req, res, next) => {
  try {
    let month = req.params.month
    let year = req.params.year
    await variationalPayment.getCurrentPayment(year, month).then((data) => {
      return res.status(200).json(data);
    })
  } catch (e) {
    return res.status(400).json(`Something went wrong. Try again. ${e.message}`);
  }
});

router.get('/current-pending-payment/:year/:month', auth(), async (req, res, next) => {
  try {
    let month = req.params.month
    let year = req.params.year
    await variationalPayment.getCurrentPendingPayment(year, month).then((data) => {
      return res.status(200).json(data);
    })
  } catch (e) {
    return res.status(400).json(`Something went wrong. Try again. ${e.message}`);
  }
});

router.patch('/update-payment-amount/:id', auth(), async (req, res, next) => {
  try {
    const schema = Joi.object({
      vp_amount: Joi.number().required(),

    });
    const vpRequest = req.body
    const validationResult = schema.validate(vpRequest)
    if (validationResult.error) {
      return res.status(400).json(validationResult.error.details[0].message);
    }
    const vpId = req.params.id


    const payments = await variationalPayment.findPayment(vpId).then((data) => {
      return data
    })

    if (_.isEmpty(payments) || _.isNull(payments)) {
      return res.status(400).json('Payment does not exists');
    }


    const updateResponse = await variationalPayment.updateAmount(vpId, vpRequest.vp_amount).then((data) => {
      return data
    })

    if (_.isEmpty(updateResponse) || _.isNull(updateResponse)) {
      return res.status(400).json('An error occurred');
    }

    return res.status(200).json('Action Successful');

  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.' + e.message);
  }
});


router.get('/unconfirmed-payment', auth(), async (req, res, next) => {
  try {
    await variationalPayment.getUnconfirmedVariationalPayment().then((data) => {
      return res.status(200).json(data);
    })
  } catch (e) {
    return res.status(400).json('Something went wrong. Try again.');
  }
});

const uploadFile = (fileRequest) => {//const fileRequest = req.files.test
  return new Promise(async (resolve, reject) => {
    let s3Res;
    const fileExt = path.extname(fileRequest.name)
    const timeStamp = new Date().getTime()
    const fileContent = Buffer.from(fileRequest.data, 'binary');
    const fileName = `${timeStamp}${fileExt}`;
    const params = {
      Bucket: 'irc-ihumane', // pass your bucket name
      Key: fileName, // file will be saved as testBucket/contacts.csv
      Body: fileContent
    };
    await s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err)
      }
      s3Res = data.Location
      resolve(s3Res)
    });
  })

}


module.exports = router;
