const { QueryTypes } = require('sequelize')
const { sequelize, Sequelize } = require('./db');
const SalaryStructure = require("../models/salarystructure")(sequelize, Sequelize.DataTypes)




async function addSalaryStructure(salaryStructureData){
    return await SalaryStructure.create({
        ss_empid: salaryStructureData.ss_empid,
        ss_pd: salaryStructureData.ss_pd,
        ss_amount: salaryStructureData.ss_amount,
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

async function findSalaryStructure(empId,){
    return await SalaryStructure.findAll({ where: { ss_empid: empId }, include: ['payment'] })

}



async function findSalaryStructures(){
   return  await SalaryStructure.findAll({
        attributes: [
            'ss_empid',
            [sequelize.fn('sum', sequelize.col('ss_amount')), 'total_amount'],
        ],
        group: ['ss_empid'],
         include: ['employee']
    });
}

async function deleteSalaryStructuresEmployee(empId){
    return await SalaryStructure.destroy({where:{ ss_empid: empId }})
}


module.exports = {
   addSalaryStructure,
    findSalaryStructure,
    deleteSalaryStructuresEmployee,
    findSalaryStructures
}
