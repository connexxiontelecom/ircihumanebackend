const Joi = require('joi');
const { sequelize, Sequelize } = require('./db');
const TaxRelief = require('../models/taxRelief')(sequelize, Sequelize.DataTypes);
const Employee = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const ReliefTypeModel = require('../models/relieftype')(sequelize, Sequelize.DataTypes);
const AWS = require('aws-sdk');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const s3 = new AWS.S3({
  accessKeyId: `${process.env.ACCESS_KEY}`,
  secretAccessKey: `${process.env.SECRET_KEY}`
});

const uploadFile = (fileRequest) => {
  return new Promise((resolve, reject) => {
    const fileExt = path.extname(fileRequest.name);
    const timeStamp = new Date().getTime();
    const fileName = `tax-reliefs/${timeStamp}${fileExt}`;

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: fileName,
      Body: fileRequest.data,
      ContentType: fileRequest.mimetype
      //ACL: 'public-read',
    };

    s3.upload(params, (err, data) => {
      if (err) return reject(err);
      resolve(data.Location);
    });
  });
};

/*const uploadFile = (fileRequest) => {
  return new Promise(async (resolve, reject) => {
    let s3Res;
    const fileExt = path.extname(fileRequest.name);
    const timeStamp = new Date().getTime();
    const fileContent = Buffer.from(fileRequest.data, 'binary');
    const fileName = `${timeStamp}${fileExt}`;
    const params = {
      Bucket: 'irc-ihumane',
      Key: fileName,
      Body: fileContent
    };
    await s3.upload(params, function (s3Err, data) {
      if (s3Err) {
        reject(s3Err);
      }
      s3Res = data.Location;
      resolve(s3Res);
    });
  });
}*/
/**
 * Validation schema
 */
const taxReliefSchema = Joi.object({
  emp_id: Joi.number().required(),
  relief_type_id: Joi.number().integer().required(),
  amount_provided: Joi.number().precision(2).default(0),
  relief_amount: Joi.number().precision(2).default(0),
  start_date: Joi.date().allow(null),
  end_date: Joi.date().allow(null),
  document: Joi.string().allow(null, ''),
  status: Joi.number().integer().allow(null)
});

const getTaxReliefs = async (req, res) => {
  try {
    const taxReliefs = await TaxRelief.findAll({
      order: [['id', 'ASC']],
      include: [
        {
          model: Employee,
          as: 'employee',
          attributes: ['emp_id', 'emp_first_name', 'emp_last_name', 'emp_unique_id']
        },
        {
          model: ReliefTypeModel,
          as: 'reliefType',
          attributes: ['id', 'relief_name']
        }
      ]
    });

    return res.status(200).json(taxReliefs);
  } catch (error) {
    console.error('Error fetching tax reliefs:', error);
    return res.status(500).json({
      message: 'Something went wrong. Try again later.'
    });
  }
};

const getTaxReliefById = async (req, res) => {
  const { id } = req.params;
  try {
    const taxRelief = await TaxRelief.findByPk(id);
    if (!taxRelief) return res.status(404).json({ message: 'Tax relief not found' });
    return res.status(200).json(taxRelief);
  } catch (error) {
    console.error('Error fetching tax relief:', error);
    return res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};

const createTaxRelief = async (req, res) => {
  try {
    const { error, value } = taxReliefSchema.validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const { emp_id, relief_type_id, status } = value;

    if (status === 1) {
      const currentReliefType = await ReliefTypeModel.findByPk(relief_type_id);
      if (!currentReliefType) {
        return res.status(400).json({ message: 'Invalid relief type' });
      }
      const reliefName = currentReliefType.relief_name.toLowerCase();
      if (['mortgage', 'rent'].includes(reliefName)) {
        const oppositeReliefName = reliefName === 'mortgage' ? 'rent' : 'mortgage';
        const oppositeReliefType = await ReliefTypeModel.findOne({
          where: { relief_name: oppositeReliefName }
        });

        if (oppositeReliefType) {
          const existingActiveOpposite = await TaxRelief.findOne({
            where: {
              emp_id,
              relief_type_id: oppositeReliefType.id,
              status: 1
            }
          });

          if (existingActiveOpposite) {
            return res.status(400).json({
              message: `Employee already has an active ${oppositeReliefName} relief. Deactivate it before adding ${reliefName}.`
            });
          }
        }
      }
    }

    let documentUrl = null;
    if (req.files && req.files.document) {
      documentUrl = await uploadFile(req.files.document);
    }

    const newTaxRelief = await TaxRelief.create({
      ...value,
      document: documentUrl
    });

    return res.status(201).json({
      message: 'Tax relief created',
      data: newTaxRelief
    });
  } catch (error) {
    console.error('Error creating tax relief:', error);
    return res.status(500).json('Error while creating tax relief');
  }
};

const updateTaxRelief = async (req, res) => {
  const { id } = req.params;
  try {
    const { error, value } = taxReliefSchema.validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const taxRelief = await TaxRelief.findByPk(id);
    if (!taxRelief) return res.status(404).json({ message: 'Tax relief not found' });

    await taxRelief.update(value);
    return res.status(200).json({ message: 'Tax relief updated', data: taxRelief });
  } catch (error) {
    console.error('Error updating tax relief:', error);
    return res.status(400).json('Error while updating tax relief');
  }
};

const deleteTaxRelief = async (req, res) => {
  const { id } = req.params;
  try {
    const taxRelief = await TaxRelief.findByPk(id);
    if (!taxRelief) return res.status(404).json({ message: 'Tax relief not found' });

    await taxRelief.destroy();
    return res.status(200).json({ message: 'Tax relief deleted successfully' });
  } catch (error) {
    console.error('Error deleting tax relief:', error);
    return res.status(400).json('Error while deleting tax relief');
  }
};

const findTaxReliefById = async (id) => {
  return await TaxRelief.findByPk(id);
};

const bulkCreateTaxRelief = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const file = req.files.file;
    const tempPath = path.join(__dirname, '../tmp', `${Date.now()}-${file.name}`);
    await file.mv(tempPath);

    const workbook = XLSX.readFile(tempPath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    const createdRecords = [];
    const skippedRecords = [];

    for (const [index, row] of rows.entries()) {
      try {
        /**
         * Expected Excel headers:
         * EmployeeUniqueId | ReliefType | AmountProvided | ReliefAmount | StartDate | EndDate | Status
         */
        const { EmployeeUniqueId, ReliefType, AmountProvided, ReliefAmount, StartDate, EndDate, Status } = row;

        if (!EmployeeUniqueId || !ReliefType) {
          skippedRecords.push({ row: index + 2, reason: 'Missing EmployeeUniqueId or ReliefType' });
          continue;
        }

        const employee = await Employee.findOne({
          where: { emp_unique_id: EmployeeUniqueId }
        });

        if (!employee) {
          skippedRecords.push({ row: index + 2, reason: `Employee not found (${EmployeeUniqueId})` });
          continue;
        }

        const reliefType = await ReliefTypeModel.findOne({
          where: { relief_name: ReliefType }
        });

        if (!reliefType) {
          skippedRecords.push({ row: index + 2, reason: `Relief type not found (${ReliefType})` });
          continue;
        }

        const status = Status !== undefined ? Number(Status) : 1;
        const reliefName = reliefType.relief_name.toLowerCase();

        if (status === 1 && ['mortgage', 'rent'].includes(reliefName)) {
          const oppositeReliefName = reliefName === 'mortgage' ? 'rent' : 'mortgage';

          const oppositeReliefType = await ReliefTypeModel.findOne({
            where: { relief_name: oppositeReliefName }
          });

          if (oppositeReliefType) {
            const existingActiveOpposite = await TaxRelief.findOne({
              where: {
                emp_id: employee.emp_id,
                relief_type_id: oppositeReliefType.id,
                status: 1
              }
            });

            if (existingActiveOpposite) {
              skippedRecords.push({
                row: index + 2,
                reason: `Active ${oppositeReliefName} already exists for employee`
              });
              continue;
            }
          }
        }

        const taxReliefData = {
          emp_id: employee.emp_id,
          relief_type_id: reliefType.id,
          amount_provided: AmountProvided || 0,
          relief_amount: ReliefAmount || 0,
          start_date: StartDate || null,
          end_date: EndDate || null,
          status
        };

        const newRecord = await TaxRelief.create(taxReliefData);
        createdRecords.push(newRecord);
      } catch (rowError) {
        skippedRecords.push({
          row: index + 2,
          reason: rowError.message
        });
      }
    }

    fs.unlinkSync(tempPath);

    return res.status(201).json({
      message: 'Bulk tax relief upload completed',
      created: createdRecords.length,
      skipped: skippedRecords.length,
      skippedRecords,
      data: createdRecords
    });
  } catch (error) {
    console.error('Error in bulk tax relief upload:', error);
    return res.status(500).json({
      message: 'Error while uploading tax reliefs',
      error: error.message
    });
  }
};

module.exports = {
  getTaxReliefs,
  getTaxReliefById,
  createTaxRelief,
  updateTaxRelief,
  deleteTaxRelief,
  findTaxReliefById,
  bulkCreateTaxRelief
};
