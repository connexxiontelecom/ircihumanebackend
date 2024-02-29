const { QueryTypes, Op } = require('sequelize');
const Joi = require('joi');

const { sequelize, Sequelize } = require('./db');
const masterListModel = require('../models/master-list')(sequelize, Sequelize.DataTypes);
const employeeModel = require('../models/Employee')(sequelize, Sequelize.DataTypes);
const locationModel = require('../models/Location')(sequelize, Sequelize.DataTypes);

const { format, subDays } = require('date-fns');

function getMasterList(month, year, location_id) {
  return masterListModel.findAll({
    where: {
      month: month,
      year: year,
      location_id: location_id
    }
  });
}

function addMasterList(masterList) {
  return masterListModel.create(masterList);
}

function updateMasterList(masterList, id) {
  return masterListModel.update(masterList, {
    where: {
      id: id
    }
  });
}

async function generateMasterList() {
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const todaysDate = new Date();
  const allLocations = await locationModel.findAll();
  for (const location of allLocations) {
    const locationId = location.id;
    const employees = await employeeModel.findAll({
      where: {
        emp_location_id: locationId,
        emp_contract_end_date: {
          [Op.gte]: todaysDate
        }
      }
    });

    const totalEmployees = employees.length;

    const shortTerm = employees.filter((emp) => emp.emp_hire_type === 'short-term').length;
    const shortTermAndCorper = employees.filter((emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'Corper').length;
    const shortTermAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'International Staff'
    ).length;
    const shortTermAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'short-term' && emp.emp_employee_category === 'National Staff'
    ).length;

    const limtedTerm = employees.filter((emp) => emp.emp_hire_type === 'limited-term').length;
    const limitedTermAndCorper = employees.filter((emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'Corper').length;
    const limitedTermAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'International Staff'
    ).length;
    const limitedTermAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'limited-term' && emp.emp_employee_category === 'National Staff'
    ).length;

    const regular = employees.filter((emp) => emp.emp_hire_type === 'regular').length;
    const regularAndCorper = employees.filter((emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'Corper').length;
    const regularAndInternationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'International Staff'
    ).length;
    const regularAndNationalStaff = employees.filter(
      (emp) => emp.emp_hire_type === 'regular' && emp.emp_employee_category === 'National Staff'
    ).length;

    const female = employees.filter((emp) => emp.emp_sex === 'Female').length;
    const femaleAndCorper = employees.filter((emp) => emp.emp_sex === 'Female' && emp.emp_employee_category === 'Corper').length;
    const femaleAndInternationalStaff = employees.filter(
      (emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'International Staff')
    ).length;
    const femaleAndNationalStaff = employees.filter((emp) => (emp.emp_sex = 'Female' && emp.emp_employee_category === 'National Staff')).length;

    const male = employees.filter((emp) => emp.emp_sex === 'Male').length;
    const maleAndCorper = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'Corper').length;
    const maleAndInternationalStaff = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'International Staff').length;
    const maleAndNationalStaff = employees.filter((emp) => emp.emp_sex === 'Male' && emp.emp_employee_category === 'National Staff').length;

    const corper = employees.filter((emp) => emp.emp_employee_category === 'Corper').length;
    const internationalStaff = employees.filter((emp) => emp.emp_employee_category === 'International Staff').length;
    const nationalStaff = employees.filter((emp) => emp.emp_employee_category === 'National Staff').length;

    const newHire = employees.filter((emp) => emp.emp_contract_hire_date.getMonth() === month && emp.emp_contract_hire_date.getFullYear() === year).length;
    const newHireAndCorper = employees.filter((emp) => emp.emp_contract_hire_date.getMonth() === month && emp.emp_contract_hire_date.getFullYear() === year && emp.emp_employee_category === 'Corper').length;
    const newHireAndInternationalStaff = employees.filter((emp)=> emp.emp_contract_hire_date.getMonth() === month && emp.emp_contract_hire_date.getFullYear() === year && emp.emp_employee_category === 'International Staff').length;
    const newHireAndNationalStaff = employees.filter((emp)=> emp.emp_contract_hire_date.getMonth() === month && emp.emp_contract_hire_date.getFullYear() === year && emp.emp_employee_category === 'National Staff').length;

    const corperPercentage = (corper / totalEmployees) * 100;
    const internationalStaffPercentage = (internationalStaff / totalEmployees) * 100;
    const nationalStaffPercentage = (nationalStaff / totalEmployees) * 100;

    const corperMasterList = {
      location_id: locationId,
      regular_term: regularAndCorper,
      limited_term: limitedTermAndCorper,
      short_term: shortTermAndCorper,
      male: maleAndCorper,
      female: femaleAndCorper,
      total: corper,
      percentage_workforce: corperPercentage,
      cost_per_site: 0,
      percentage_cost_per_site: 0,
      new_hire: newHireAndCorper,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 1
    };

    const internationalStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndInternationalStaff,
      limited_term: limitedTermAndInternationalStaff,
      short_term: shortTermAndInternationalStaff,
      male: maleAndInternationalStaff,
      female: femaleAndInternationalStaff,
      total: internationalStaff,
      percentage_workforce: internationalStaffPercentage,
      cost_per_site: 0,
      percentage_cost_per_site: 0,
      new_hire: newHireAndInternationalStaff,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 2
    };

    const nationalStaffMasterList = {
      location_id: locationId,
      regular_term: regularAndNationalStaff,
      limited_term: limitedTermAndNationalStaff,
      short_term: shortTermAndNationalStaff,
      male: maleAndNationalStaff,
      female: femaleAndNationalStaff,
      total: nationalStaff,
      percentage_workforce: nationalStaffPercentage,
      cost_per_site: 0,
      percentage_cost_per_site: 0,
      new_hire: newHireAndNationalStaff,
      relocate_from: 0,
      relocate_to: 0,
      exit: 0,
      month: month,
      year: year,
      sub_category: 3
    };

    const masterList = {
        location_id: locationId,
        regular_term: regular,
        limited_term: limtedTerm,
        short_term: shortTerm,
        male: male,
        female: female,
        total: totalEmployees,
        percentage_workforce: 100,
        cost_per_site: 0,
        percentage_cost_per_site: 0,
        new_hire: newHire,
        relocate_from: 0,
        relocate_to: 0,
        exit: 0,
        month: month,
        year: year,
        sub_category: 0
    }

    await Promise.all([
      updateOrCreateMasterList(corperMasterList),
      updateOrCreateMasterList(internationalStaffMasterList),
      updateOrCreateMasterList(nationalStaffMasterList),
      updateOrCreateMasterList(masterList)
    ]);
  }

}

async function updateOrCreateMasterList(masterListData: any) {
  const { month, year, sub_category, location_id } = masterListData;
  const existingMasterList = await masterListModel.findOne({
    where: {
      month,
      year,
      sub_category,
      location_id
    }
  });

  if (existingMasterList) {
    await masterListModel.update(masterListData, {
      where: {
        id: existingMasterList.id
      }
    });
  } else {
    await masterListModel.create(masterListData);
  }
}


module.exports = {
 generateMasterList
};
