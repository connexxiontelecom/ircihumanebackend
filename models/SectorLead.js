'use strict';
const {sequelize, Sequelize} = require("../services/db");
const {
    Model
} = require('sequelize');
const Department = require("../models/Department")(sequelize, Sequelize.DataTypes);
const Employee = require("../models/Employee")(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
    class SectorLead extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            // define association here
        }
    };
    SectorLead.init({
        sl_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true // Automatically gets converted to SERIAL for postgres
        },
        sl_sector_id: DataTypes.STRING,
        sl_employee_id: DataTypes.STRING,
        createdAt: {
            field: 'created_at',
            type: DataTypes.DATE,
        },
        updatedAt: {
            field: 'updated_at',
            type: DataTypes.DATE,
        },
    }, {
        sequelize,
        modelName: 'SectorLead',
        tableName: 'sector_leads'
    });
    SectorLead.belongsTo(Department, { foreignKey: 'sl_sector_id' });
    SectorLead.belongsTo(Employee, { foreignKey: 'sl_employee_id' });
    SectorLead.hasMany(Employee, { foreignKey: 'emp _id' });
    return SectorLead;
};
