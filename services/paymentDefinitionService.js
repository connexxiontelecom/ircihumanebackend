const { QueryTypes } = require('sequelize')

const bcrypt = require("bcrypt");
const { sequelize, Sequelize } = require('./db');
const Pd = require("../models/paymentdefinition")(sequelize, Sequelize.DataTypes)

const helper  = require('../helper');


async function addPaymentDefinition(pd){


    return await Pd.create({
        pd_payment_code: pd.pd_payment_code,
        pd_payment_name: pd.pd_payment_name,
        pd_payment_type: pd.pd_payment_type,
        pd_payment_variant: pd.pd_payment_variant,
        pd_payment_taxable: pd.pd_payment_taxable,
        pd_desc: pd.pd_desc,
        pd_basic: pd.pd_basic,
        pd_tie_number: pd.pd_tie_number,
    });
}

// async function updateUser(user, user_id){
//     if(user.user_password){
//         const salt = await bcrypt.genSalt(10);
//         user.user_password = await bcrypt.hash(user.user_password, salt);
//     }
//
//     return  await User.update({
//         user_username: user.user_username,
//         user_name: user.user_name,
//         user_email: user.user_email,
//         user_password: user.user_password,
//         user_type: user.user_type,
//         user_token: user.user_token,
//         user_status: user.user_status,
//     },{
//         where:{
//             user_id:user_id
//         } });
// }
//
// async function findUserByEmail(email){
//     return await User.findOne({ where: { user_email: email } })
// }
//
// async function findUserByUsername(username){
//     return await User.findOne({ where: { user_username: username } })
// }
//
// async function findUserByUserId(userId){
//     return await User.findOne({ where: { user_id: userId } })
// }


module.exports = {
    addPaymentDefinition,
    // findUserByEmail,
    // findUserByUsername,
    // findUserByUserId,
    // updateUser
}
