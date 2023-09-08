'use strict';
const { sequelize, Sequelize } = require('../services/db');
const { Model } = require('sequelize');

const Pd = require('../models/paymentdefinition')(sequelize, Sequelize.DataTypes);
const Employee = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const Location = require('../models/Location')(sequelize, Sequelize.DataTypes);
const Jobrole = require('../models/JobRole')(sequelize, Sequelize.DataTypes);
const Bank = require('../models/Bank')(sequelize, Sequelize.DataTypes);
const Sector = require('../models/Department')(sequelize, Sequelize.DataTypes);
module.exports = (sequelize, DataTypes) => {
  class salary extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async generateEmployeesTimesheetReportByLocation(empIds, locationId, month, year) {
      return await salary.findAll({
        group: ['salary_empid'],
        include: [
          { model: Employee, as: 'employee' },
          { model: Location, as: 'location' },
          { model: Jobrole, as: 'jobrole' }
        ],
        where: {
          salary_empid: empIds,
          salary_location_id: locationId,
          salary_paymonth: month,
          salary_payyear: year
        }
      });
    }

    static async generateAllEmployeesTimesheetReport(empIds, month, year) {
      return await salary.findAll({
        group: ['salary_empid'],
        include: [
          {
            model: Employee,
            as: 'employee',
            include: [{ model: Sector, as: 'sector' }]
          },
          { model: Location, as: 'location' },
          { model: Jobrole, as: 'jobrole' }
        ],
        where: {
          salary_empid: empIds,
          salary_paymonth: month,
          salary_payyear: year
        }
      });
    }
  }
  salary.init(
    {
      salary_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true // Automatically gets converted to SERIAL for postgres
      },
      salary_empid: DataTypes.INTEGER,
      salary_paymonth: DataTypes.STRING,
      salary_payyear: DataTypes.STRING,
      salary_pd: DataTypes.INTEGER,
      salary_share: DataTypes.DOUBLE,
      salary_tax: DataTypes.INTEGER,
      salary_confirmed: DataTypes.INTEGER,
      salary_amount: DataTypes.DOUBLE,
      salary_approved: DataTypes.INTEGER,
      salary_approved_by: DataTypes.INTEGER,
      salary_approved_date: DataTypes.DATE,
      salary_confirmed_by: DataTypes.INTEGER,
      salary_confirmed_date: DataTypes.DATE,
      salary_location_id: DataTypes.INTEGER,
      salary_jobrole_id: DataTypes.INTEGER,
      salary_department_id: DataTypes.INTEGER,
      salary_grade: DataTypes.STRING,
      salary_gross: DataTypes.DOUBLE,
      salary_emp_name: DataTypes.STRING,
      salary_emp_unique_id: DataTypes.STRING,
      salary_emp_start_date: DataTypes.DATE,
      salary_emp_end_date: DataTypes.DATE,
      salary_bank_id: DataTypes.STRING,
      salary_account_number: DataTypes.STRING,
      salary_sort_code: DataTypes.STRING,
      salary_pfa: DataTypes.STRING,
      salary_d7: DataTypes.STRING,
      salary_emp_vendor_account: DataTypes.STRING
    },
    {
      sequelize,
      modelName: 'salary',
      tableName: 'salary'
    }
  );

  salary.belongsTo(Pd, { as: 'payment', foreignKey: 'salary_pd' });
  salary.hasMany(Pd, { foreignKey: 'pd_id' });

  salary.belongsTo(Employee, { as: 'employee', foreignKey: 'salary_empid' });
  salary.hasMany(Employee, { foreignKey: 'emp_id' });

  salary.belongsTo(Location, { as: 'location', foreignKey: 'salary_location_id' });

  salary.belongsTo(Jobrole, { as: 'jobrole', foreignKey: 'salary_jobrole_id' });

  salary.belongsTo(Bank, { as: 'bank', foreignKey: 'salary_bank_id' });
  salary.hasMany(Bank, { foreignKey: 'bank_id' });

  return salary;
};
