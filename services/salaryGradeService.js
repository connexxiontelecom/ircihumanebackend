const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const SalaryGrade = require("../models/salarygrade")(sequelize, Sequelize.DataTypes)




async function addSalaryGrade(salaryGradeData){
    return await SalaryGrade.create({
        sg_name: salaryGradeData.sg_name,
        sg_minimum: salaryGradeData.sg_minimum,
        sg_midpoint: salaryGradeData.sg_midpoint,
        sg_maximum: salaryGradeData.sg_maximum,

     });
}

async function updateSalaryGrade(sgId, salaryGradeData){
    return await SalaryGrade.update({
        tsg_name: salaryGradeData.sg_name,
        sg_minimum: salaryGradeData.sg_minimum,
        sg_midpoint: salaryGradeData.sg_midpoint,
        sg_maximum: salaryGradeData.sg_maximum,

    }, {
            where:{
                sg_id:sgId
            }
        });
}

async function findSalaryGrade(sgId,){
    return await SalaryGrade.findOne({ where: { sg_id: sgId } })

}

async function findSalaryGradeByName(sgName){
    return await SalaryGrade.findOne({where:{ sg_name: sgName}})
}

async function findSalaryGrades(){
    return await SalaryGrade.findAll()
}

async function getSalaryGrade(sgId){
    return findSalaryGrade(sgId).then((data) => {
        return data
    })

}





module.exports = {
    addSalaryGrade,
    updateSalaryGrade,
    findSalaryGrade,
    findSalaryGrades,
    findSalaryGradeByName,
    getSalaryGrade
}
