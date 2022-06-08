'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class permission extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  permission.init({
    perm_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true // Automatically gets converted to SERIAL for postgres
    },
    perm_user_id: DataTypes.INTEGER,
    perm_manage_user: DataTypes.INTEGER,
    perm_hr_config: DataTypes.INTEGER,
    perm_payroll_config: DataTypes.INTEGER,
    perm_payment_definition: DataTypes.INTEGER,
    perm_onboard_employee: DataTypes.INTEGER,
    perm_manage_employee: DataTypes.INTEGER,
    perm_assign_supervisors: DataTypes.INTEGER,
    perm_announcement: DataTypes.INTEGER,
    perm_query: DataTypes.INTEGER,
    perm_leave: DataTypes.INTEGER,
    perm_travel: DataTypes.INTEGER,
    perm_timesheet: DataTypes.INTEGER,
    perm_self_assessment: DataTypes.INTEGER,
    perm_leave_management: DataTypes.INTEGER,
    perm_setup_variations: DataTypes.INTEGER,
    perm_confirm_variations: DataTypes.INTEGER,
    perm_approve_variations: DataTypes.INTEGER,
    perm_decline_variations: DataTypes.INTEGER,
    perm_run_payroll: DataTypes.INTEGER,
    perm_undo_payroll: DataTypes.INTEGER,
    perm_confirm_payroll: DataTypes.INTEGER,
    perm_approve_payroll: DataTypes.INTEGER,
    perm_journal_code_setup: DataTypes.INTEGER,
    perm_salary_mapping: DataTypes.INTEGER,
    perm_undo_salary_mapping: DataTypes.INTEGER,
    perm_payroll_journal: DataTypes.INTEGER,
    perm_application_tracking: DataTypes.INTEGER,
    perm_supervisor_reassignment: DataTypes.INTEGER,

  }, {
    sequelize,
    modelName: 'permission',
    tableName: 'permissions'
  });
  return permission;
};