const Joi = require('joi');
const { sequelize, Sequelize } = require('./db');
const ReliefType = require('../models/relieftype')(sequelize, Sequelize.DataTypes);
const reliefTypeSchema = Joi.object({
  relief_name: Joi.string().trim().min(2).required()
});

const getReliefTypes = async (req, res) => {
  try {
    const reliefTypes = await ReliefType.findAll({
      attributes: ['id', 'relief_name', 'createdAt', 'updatedAt'],
      order: [['relief_name', 'ASC']]
    });

    return res.status(200).json(reliefTypes);
  } catch (error) {
    console.error('Error fetching relief types:', error);
    return res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};
const getReliefTypeById = async (req, res) => {
  const { id } = req.params;

  try {
    const reliefType = await ReliefType.findByPk(id);

    if (!reliefType) {
      return res.status(404).json({ message: 'Relief type not found' });
    }

    return res.status(200).json(reliefType);
  } catch (error) {
    console.error('Error fetching relief type:', error);
    return res.status(500).json({ message: 'Something went wrong. Try again later.' });
  }
};
const createReliefType = async (req, res) => {
  try {
    const { error, value } = reliefTypeSchema.validate(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const reliefType = await ReliefType.create({
      relief_name: value.relief_name
    });
    return res.status(201).json({ message: 'Relief type created successfully', data: reliefType });
  } catch (error) {
    console.error('Error creating relief type:', error);
    return res.status(400).json('Error while creating relief type');
  }
};

const updateReliefType = async (req, res) => {
  const { id } = req.params;

  try {
    const { error, value } = reliefTypeSchema.validate(req.body);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const reliefType = await ReliefType.findByPk(id);
    if (!reliefType) {
      return res.status(404).json({ message: 'Relief type not found' });
    }

    await reliefType.update({
      relief_name: value.relief_name
    });

    return res.status(200).json({ message: 'Relief type updated successfully', data: reliefType });
  } catch (error) {
    console.error('Error updating relief type:', error);
    return res.status(400).json('Error while updating relief type');
  }
};
const deleteReliefType = async (req, res) => {
  const { id } = req.params;

  try {
    const reliefType = await ReliefType.findByPk(id);
    if (!reliefType) {
      return res.status(404).json({ message: 'Relief type not found' });
    }

    await reliefType.destroy();

    return res.status(200).json({ message: 'Relief type deleted successfully' });
  } catch (error) {
    console.error('Error deleting relief type:', error);
    return res.status(400).json('Error while deleting relief type');
  }
};

const findReliefTypeById = async (id) => {
  return await ReliefType.findByPk(id);
};

module.exports = {
  getReliefTypes,
  getReliefTypeById,
  createReliefType,
  updateReliefType,
  deleteReliefType,
  findReliefTypeById
};
