"use strict";
const { sequelize, Sequelize } = require("../services/db");
const { Model, Op } = require("sequelize");

const Location = require("../models/Location")(sequelize, Sequelize.DataTypes);
const JobRole = require("../models/JobRole")(sequelize, Sequelize.DataTypes);
const Bank = require("../models/Bank")(sequelize, Sequelize.DataTypes);
const Department = require("../models/Department")(
  sequelize,
  Sequelize.DataTypes
);
const StateModel = require("../models/State")(sequelize, Sequelize.DataTypes);
const LgaModel = require("../models/localgovernment")(
  sequelize,
  Sequelize.DataTypes
);
const pensionModel = require("../models/PensionProvider")(
  sequelize,
  Sequelize.DataTypes
);
const ReportingEntityModel = require("../models/reportingentity")(
  sequelize,
  Sequelize.DataTypes
);
const OperationUnitModel = require("../models/operationunit")(
  sequelize,
  Sequelize.DataTypes
);
const FunctionalAreaModel = require("../models/functionalarea")(
  sequelize,
  Sequelize.DataTypes
);
const SalaryGradeModel = require("../models/salarygrade")(
  sequelize,
  Sequelize.DataTypes
);
//const SalaryStructureModel = require("../models/salarystructure")(sequelize, Sequelize.DataTypes);

//const authorizationModel = require('../models/AuthorizationAction')(sequelize, Sequelize.DataTypes);
//const travelApplicationModel = require('../models/TravelApplication')(sequelize, Sequelize.DataTypes);
//const Department = require("../models/Department")(sequelize, Sequelize.DataTypes)

module.exports = (sequelize, DataTypes) => {
  class Employee extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static async getEmployeeById(id) {
      return await Employee.findOne({ where: { emp_id: id } });
    }

    static async getEmployeeByUniqueId(id) {
      return await Employee.findOne({ where: { emp_unique_id: id } });
    }
    static async getEmployeeByD7(d7) {
      return await Employee.findOne({ where: { emp_d7: d7 } });
    }

    static async updateEmployeeGrossSalary(empId, salary) {
      return await Employee.update(
        {
          emp_gross: salary,
        },
        {
          where: {
            emp_id: empId,
          },
        }
      );
    }

    static async getEmployeeByLocationId(locationId) {
      return await Employee.findOne({ where: { emp_location_id: locationId } });
    }
    static async getEmployeesByLocationIds(locationIds) {
      return await Employee.findAll({
        where: { emp_location_id: locationIds },
      });
    }

    static async getEmployeesBySectorIds(sectorIds) {
      return await Employee.findAll({
        where: { emp_department_id: sectorIds },
      });
    }

    static async getListOfEmployeesSupervising(empId) {
      return await Employee.findAll({ where: { emp_supervisor_id: empId } });
    }

    static async getListOfEmployeesByStatus(status) {
      return await Employee.findAll({ where: { emp_status: status } });
    }

    static async updateEmployeeRelocatableStatus(empId, status) {
      return await Employee.update(
        {
          emp_relocatable: status,
        },
        {
          where: {
            emp_id: empId,
          },
        }
      );
    }
    static async getEmployeeLeaveAccrual(year) {
      return Employee.findAll({
        attributes: [
          "emp_first_name",
          "emp_id",
          "emp_last_name",
          "emp_unique_id",
        ],
        where: {
          emp_id: {
            [Op.in]: sequelize.literal(
              `(SELECT la.lea_emp_id, la.lea_rate  FROM leave_accruals la
                  WHERE la.lea_year = ${year} GROUP BY la.lea_emp_id)`
            ),
          },
        },
      });
    }
  }
  Employee.init(
    {
      emp_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true, // Automatically gets converted to SERIAL for postgres
      },
      emp_unique_id: DataTypes.INTEGER,
      emp_first_name: DataTypes.STRING,
      emp_other_name: DataTypes.STRING,
      emp_last_name: DataTypes.STRING,
      emp_dob: DataTypes.DATE,
      emp_personal_email: DataTypes.STRING,
      emp_office_email: DataTypes.STRING,
      emp_phone_no: DataTypes.STRING,
      emp_qualification: DataTypes.STRING,
      emp_location_id: DataTypes.INTEGER,
      emp_subsidiary_id: DataTypes.INTEGER,
      emp_job_role_id: DataTypes.INTEGER,
      emp_department_id: DataTypes.INTEGER,
      emp_grade_id: DataTypes.INTEGER,
      emp_account_no: DataTypes.STRING,
      emp_bank_id: DataTypes.INTEGER,
      emp_hmo_no: DataTypes.STRING,
      emp_hmo_id: DataTypes.INTEGER,
      emp_pensionable: DataTypes.INTEGER,
      emp_pension_no: DataTypes.STRING,
      emp_pension_id: DataTypes.STRING,
      emp_paye_no: DataTypes.STRING,
      emp_passport: DataTypes.STRING,
      emp_nysc_details: DataTypes.STRING,
      emp_nysc_document: DataTypes.STRING,
      emp_state_id: DataTypes.INTEGER,
      emp_lga_id: DataTypes.INTEGER,
      emp_marital_status: DataTypes.INTEGER,
      emp_spouse_name: DataTypes.STRING,
      emp_spouse_phone_no: DataTypes.STRING,
      emp_next_of_kin_name: DataTypes.STRING,
      emp_next_of_kin_address: DataTypes.STRING,
      emp_next_of_kin_phone_no: DataTypes.STRING,
      emp_sex: DataTypes.STRING,
      emp_religion: DataTypes.STRING,
      emp_ailments: DataTypes.STRING,
      emp_blood_group: DataTypes.STRING,
      emp_genotype: DataTypes.STRING,
      emp_emergency_name: DataTypes.STRING,
      emp_emergency_contact: DataTypes.STRING,
      emp_employment_date: DataTypes.DATE,
      emp_status: DataTypes.INTEGER,
      emp_suspension_reason: DataTypes.STRING,
      emp_stop_date: DataTypes.DATE,
      emp_salary_structure_setup: DataTypes.INTEGER,
      emp_salary_structure_category: DataTypes.INTEGER,
      emp_tax_amount: DataTypes.DOUBLE,
      emp_supervisor_status: DataTypes.INTEGER,
      emp_supervisor_id: DataTypes.INTEGER,
      emp_gross: DataTypes.DOUBLE,
      emp_hire_date: DataTypes.DATE,
      emp_contract_end_date: DataTypes.DATE,
      emp_bvn: DataTypes.STRING,
      emp_nhf: DataTypes.STRING,
      emp_type: DataTypes.INTEGER,
      emp_master_id: DataTypes.INTEGER,
      emp_unit_name: DataTypes.STRING,
      emp_cost_center: DataTypes.STRING,
      emp_nin: DataTypes.STRING,
      emp_d4: DataTypes.INTEGER,
      emp_d5: DataTypes.INTEGER,
      emp_d6: DataTypes.INTEGER,
      emp_d7: DataTypes.INTEGER,
      emp_relocatable: DataTypes.INTEGER,
      emp_contract_hire_date: DataTypes.DATE,
      emp_contact_address: DataTypes.STRING,
      emp_vendor_account: DataTypes.STRING,
      emp_nhf_status: DataTypes.BOOLEAN,

      emp_probation_end_date:DataTypes.DATE,
      emp_probation : DataTypes.STRING,

      emp_employee_type: DataTypes.STRING,
      emp_employee_category: DataTypes.STRING,
      emp_hire_type: DataTypes.STRING,
      createdAt: {
        field: "created_at",
        type: DataTypes.DATE,
      },
      updatedAt: {
        field: "updated_at",
        type: DataTypes.DATE,
      },
    },
    {
      sequelize,
      modelName: "Employee",
      tableName: "employees",
      timestamps: true,
    }
  );

  Employee.belongsTo(SalaryGradeModel, {
    as: "salaryGrade",
    foreignKey: "emp_grade_id",
  });
  //Employee.belongsTo(SalaryStructureModel, {as: 'salary_structure', foreignKey: 'ss_empid'})
  Employee.belongsTo(Employee, {
    as: "supervisor",
    foreignKey: "emp_supervisor_id",
  });
  Employee.hasMany(Employee, { foreignKey: "emp_id" });

  Employee.belongsTo(Location, {
    as: "location",
    foreignKey: "emp_location_id",
  });
  Employee.hasMany(Location, { foreignKey: "location_id" });

  // Employee.belongsTo(JobRole, { foreignKey: 'emp_job_role_id'})
  // Employee.hasMany(JobRole, {foreignKey: 'job_role_id'})

  Employee.belongsTo(JobRole, { as: "jobrole", foreignKey: "emp_job_role_id" });
  Employee.hasMany(JobRole, { foreignKey: "job_role_id" });

  Employee.belongsTo(Bank, { as: "bank", foreignKey: "emp_bank_id" });
  Employee.hasMany(Bank, { foreignKey: "bank_id" });

  Employee.belongsTo(Department, {
    as: "sector",
    foreignKey: "emp_department_id",
  });
  Employee.hasMany(Department, { foreignKey: "department_id" });

  Employee.belongsTo(StateModel, { as: "state", foreignKey: "emp_state_id" });
  Employee.hasMany(StateModel, { foreignKey: "s_id" });

  Employee.belongsTo(LgaModel, { as: "lga", foreignKey: "emp_lga_id" });
  Employee.hasMany(LgaModel, { foreignKey: "lg_id" });

  Employee.belongsTo(pensionModel, {
    as: "pension",
    foreignKey: "emp_pension_id",
  });
  Employee.hasMany(pensionModel, { foreignKey: "pension_provider_id" });

  Employee.belongsTo(OperationUnitModel, {
    as: "operationUnit",
    foreignKey: "emp_d4",
  });
  Employee.hasMany(OperationUnitModel, { foreignKey: "ou_id" });

  Employee.belongsTo(ReportingEntityModel, {
    as: "reportingEntity",
    foreignKey: "emp_d5",
  });
  Employee.hasMany(ReportingEntityModel, { foreignKey: "re_id" });

  Employee.belongsTo(FunctionalAreaModel, {
    as: "functionalArea",
    foreignKey: "emp_d6",
  });
  Employee.hasMany(FunctionalAreaModel, { foreignKey: "fa_id" });

  //Employee.belongsTo(FunctionalAreaModel, {as:'functionalArea', foreignKey:'emp_d6'});

  //Employee.hasMany(authorizationModel, {foreignKey:'auth_officer_id',  as: 'officers'});
  //Employee.belongsTo(travelApplicationModel, { foreignKey:'emp_id', as: 'applicant' });

  //Employee.belongsTo(Department, { as: 'sector', foreignKey: 'jb_department_id' })
  // JobRole.hasMany(Department, { foreignKey: 'department_id' })

  return Employee;
};
