const {sequelize, Sequelize} = require('./db');
const Permission = require("../models/permission")(sequelize, Sequelize.DataTypes)

async function addPermission(permission) {
    return await Permission.create({
        perm_user_id: permission.perm_user_id,
        perm_manage_user: permission.perm_manage_user,
        perm_hr_config: permission.perm_hr_config,
        perm_payroll_config: permission.perm_payroll_config,
        perm_payment_definition: permission.perm_payment_definition,
        perm_onboard_employee: permission.perm_onboard_employee,
        perm_manage_employee: permission.perm_manage_employee,
        perm_assign_supervisors: permission.perm_assign_supervisors,
        perm_announcement: permission.perm_announcement,
        perm_query: permission.perm_query,
        perm_leave: permission.perm_leave,
        perm_travel: permission.perm_travel,
        perm_timesheet: permission.perm_timesheet,
        perm_self_assessment: permission.perm_self_assessment,
        perm_leave_management: permission.perm_leave_management,
        perm_setup_variations: permission.perm_setup_variations,
        perm_confirm_variations: permission.perm_confirm_variations,
        perm_approve_variations: permission.perm_approve_variations,
        perm_decline_variations: permission.perm_decline_variations,
        perm_run_payroll: permission.perm_run_payroll,
        perm_undo_payroll: permission.perm_undo_payroll,
        perm_confirm_payroll: permission.perm_confirm_payroll,
        perm_approve_payroll: permission.perm_approve_payroll,
    });
}

async function updatePermission(permission) {
    return await Permission.update(
        {
            perm_manage_user: permission.perm_manage_user,
            perm_hr_config: permission.perm_hr_config,
            perm_payroll_config: permission.perm_payroll_config,
            perm_payment_definition: permission.perm_payment_definition,
            perm_onboard_employee: permission.perm_onboard_employee,
            perm_manage_employee: permission.perm_manage_employee,
            perm_assign_supervisors: permission.perm_assign_supervisors,
            perm_announcement: permission.perm_announcement,
            perm_query: permission.perm_query,
            perm_leave: permission.perm_leave,
            perm_travel: permission.perm_travel,
            perm_timesheet: permission.perm_timesheet,
            perm_self_assessment: permission.perm_self_assessment,
            perm_leave_management: permission.perm_leave_management,
            perm_setup_variations: permission.perm_setup_variations,
            perm_confirm_variations: permission.perm_confirm_variations,
            perm_approve_variations: permission.perm_approve_variations,
            perm_decline_variations: permission.perm_decline_variations,
            perm_run_payroll: permission.perm_run_payroll,
            perm_undo_payroll: permission.perm_undo_payroll,
            perm_confirm_payroll: permission.perm_confirm_payroll,
            perm_approve_payroll: permission.perm_approve_payroll,
        },
        {
            where: {
                perm_user_id: permission.perm_user_id,
            },
        }
    )


}

async function deletePermission(userId){
    return await Permission.destroy({where: {
            perm_user_id: userId
        }})
}

async function getPermission(userId){
    return await Permission.findOne({where: {
            perm_user_id: userId
        }})
}


module.exports = {
    addPermission,
    updatePermission,
    deletePermission,
    getPermission
}
