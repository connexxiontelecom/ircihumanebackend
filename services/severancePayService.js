const {sequelize, Sequelize} = require('./db');
const SeverancePayService = require("../models/severancePay")(sequelize, Sequelize.DataTypes);

async function addSeverancePay(severancePay) {
    return await SeverancePayService.create({
        sp_empid: severancePay.sp_empid,
        sp_d7: severancePay.sp_d7,
        sp_t7:severancePay.sp_t7,
        sp_amount:severancePay.sp_amount,
        sp_month: severancePay.sp_month,
        sp_year: severancePay.sp_year,
        sp_location_id: severancePay.sp_location_id,
        sp_created_by:severancePay.sp_created_by,
    });
}

module.exports = {
    addSeverancePay
}
