require('dotenv').config();

const { sequelize, Sequelize } = require('../db');
const _ = require('lodash');
const path = require('path');
const reader = require('xlsx');
const fs = require('fs');

const EmployeeModel = require('../../models/Employee')(sequelize, Sequelize.DataTypes);
const timeAllocationModel = require('../../models/timeallocation')(sequelize, Sequelize.DataTypes);
const timesheetModel = require('../../models/timesheet')(sequelize, Sequelize.DataTypes);
const publicHolidayModel = require('../../models/PublicHoliday')(sequelize, Sequelize.DataTypes);
const authorizationModel = require('../../models/AuthorizationAction')(sequelize, Sequelize.DataTypes);
//const salaryMappingDetailsModel = require('../../models/salarymappingdetails')(sequelize, Sequelize.DataTypes);
//const salaryMappingMasterModel = require('../../models/salarymappingmaster')(sequelize, Sequelize.DataTypes);

const timesheetBulkUploadFix = async () => {
  try {
    const filePath = path.resolve(__dirname, '../../assets/TimesheetD1Charge.xlsx');
    const successLog = path.resolve(__dirname, '../../assets/timesheet-success.txt');
    const failedLog = path.resolve(__dirname, '../../assets/timesheet-failed.txt');

    const workBook = reader.readFile(filePath);
    const sheet = workBook.Sheets[workBook.SheetNames[0]];
    const rows = reader.utils.sheet_to_json(sheet);

    let counter = 0;

    for (const row of rows) {
      const emp = await EmployeeModel.findOne({
        where: { emp_unique_id: row.T7 },
      });

      if (!emp) {
        fs.appendFileSync(failedLog, `${row.T7} (Employee not found)\n`);
        continue;
      }

      const supervisor = await EmployeeModel.findOne({
        where: { emp_unique_id: row.SupervisorID },
      });

      const { month, year } = parseTimesheetPeriod(row.TimesheetPeriod);
      if (!month || !year) {
        fs.appendFileSync(failedLog, `${row.T7} (Invalid TimesheetPeriod)\n`);
        continue;
      }

      const refNo = generateRef();
      const supervisorId = supervisor?.emp_id ?? null;

      const publicHolidays = await getPublicHolidays(year, month);
      const lastDay = getLastDayOfMonth(year, month);
      await sequelize.transaction(async (t) => {
        const allocations = extractAllocations(row);

        if (allocations.length === 0) {
          console.log(`No allocations for ${emp.emp_unique_id}`);
          return;
        }


        for (const alloc of allocations) {
          //console.log("=====================================================================")
          //console.log(alloc)
          //console.log("=====================================================================")

          await timeAllocationModel.create({
            ta_emp_id: emp.emp_id,
            ta_month: month,
            ta_year: year,
            ta_tcode: alloc.tcode,
            ta_charge: alloc.charge,
            ta_status: 0,
            //ta_approved_by: supervisorId,
            //ta_comment: row.SupervisorToApprove,
            ta_ref_no: refNo,
            ta_t0_code: null,
            ta_t0_percent: null,
          }, { transaction: t });

          counter++;
        }


        //authorization action
        await authorizationModel.create({
          auth_travelapp_id: refNo,
          auth_officer_id: supervisorId,
          auth_status: 0,
          auth_type: 2,
          auth_comment: 'Time allocation/time sheet initialized.',
          //auth_role_id: 0,
          auth_ts_month: month,
          auth_ts_year: year,
          //auth_ts_activity: 0,
        }, { transaction: t });

        for (let day = 1; day <= lastDay; day++) {
          const date = new Date(year, month - 1, day);
          if (isWeekend(date)) continue;
          const isHoliday = publicHolidays.includes(date.toDateString());
          await timesheetModel.create({
            ts_emp_id: emp.emp_id,
            ts_month: month,
            ts_year: year,
            ts_day: day,
            ts_start: '08:00',
            ts_end: '17:15',
            ts_duration: 8.45,
            ts_is_present: isHoliday ? 4 : 1,
            ts_ref_no: refNo,
            ts_status: 0,
          }, { transaction: t });
        }
        console.log(`Processed ${emp.emp_unique_id} (${month}/${year}) with ${allocations.length} allocations`);

      });
    }
    console.log(`${counter} employees processed successfully`);
  } catch (error) {
    console.error('Bulk upload failed:', error);
  }
};


function parseTimesheetPeriod(value) {
  if (value instanceof Date) {
    return { month: value.getMonth() + 1, year: value.getFullYear() };
  }

  if (typeof value === 'number') {
    const excelDate = new Date((value - 25569) * 86400 * 1000);
    return { month: excelDate.getMonth() + 1, year: excelDate.getFullYear() };
  }

  if (typeof value === 'string') {
    const [mon, yr] = value.split('-');
    const months = {
      Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
      Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
    };
    return { month: months[mon], year: 2000 + Number(yr) };
  }

  return {};
}

function generateRef(length = 11) {
  return Array.from({ length }, () =>
    'abcdefghijklmnopqrstuvwxyz0123456789'[Math.floor(Math.random() * 36)]
  ).join('');
}

function isWeekend(date) {
  return [0, 6].includes(date.getDay());
}

async function getPublicHolidays(year, month) {
  const holidays = await publicHolidayModel.findAll({
    where: {
      [Sequelize.Op.and]: [
        Sequelize.where(Sequelize.fn('MONTH', Sequelize.col('ph_date')), month),
        Sequelize.where(Sequelize.fn('YEAR', Sequelize.col('ph_date')), year),
      ],
    },
    attributes: ['ph_date'],
  });

  return holidays.map(h => new Date(h.ph_date).toDateString());
}

function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function extractAllocations(row) {
  const pairs = [
    ['D1', 'Charge'],
    ['D1a', 'Charge2'],
    ['D1b', 'Charge3'],
    ['D1c', 'Charge4'],
    ['D1d', 'Charge5'],
  ];

  const allocations = [];

  for (const [dKey, cKey] of pairs) {
    const tcode = row[dKey];
    const charge = row[cKey];

    if (tcode && charge && Number(charge) > 0) {
      allocations.push({
        tcode: String(tcode).trim(),
        charge: Number(charge),
      });
    }
  }

  return allocations;
}


timesheetBulkUploadFix();

module.exports = { timesheetBulkUploadFix };
