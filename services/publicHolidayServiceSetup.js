const {QueryTypes, Op} = require('sequelize')
const Joi = require('joi')
const _ = require('lodash');
const isBefore = require('date-fns/isBefore')
const {sequelize, Sequelize} = require('./db');
const PublicHoliday = require("../models/PublicHoliday")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')
const leaveApplicationModel = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const leaveAccrualModel = require("../models/leaveaccrual")(sequelize, Sequelize.DataTypes);
const { fn, col, literal } = require('sequelize');

const helper = require('../helper');
const {getEmployeeByIdOnly} = require("./employeeService");
const { isWeekend } = require('date-fns');
const errHandler = (err) => {
  console.log("Error: ", err);
}
const getAllPublicHolidays = async (req, res) => {
  try {
    const holidays = await PublicHoliday.findAll({
      attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_group', 'ph_month', 'ph_year', 'ph_to_day', 'ph_to_month', 'ph_to_year'],
      group: ['ph_group']
    });
    return res.status(200).json(holidays)
  } catch (err) {
    return res.status(500).json({message: `Error while fetching public holidays ${err.message}`})
  }
}
const getCurrentYearPublicHolidays = async (req, res) => {
  try {
    const holidays = await PublicHoliday.getThisYearsPublicHolidays();
    return res.status(200).json(holidays)
  } catch (err) {
    return res.status(400).json({message: `Error while fetching public holidays ${err.message}`})
  }
}

const getCurrentYearPublicHolidaysByLocation = async (req, res) => {
  try {
    const locationId = parseInt(req.params.location);
    const holidayArr = [];
    if(!_.isEmpty(locationId) || !_.isNull(locationId)){
      const holidays = await PublicHoliday.getThisYearsPublicHolidays();
      //return res.status(200).json(holidays);
      if(!_.isNull(holidays) || !_.isEmpty(holidays) ){
        holidays.map(holiday=>{
          if(!(_.isNull(holiday.ph_location)) || !(_.isEmpty(holiday.ph_location))){
            let locationsString = holiday.ph_location.split(",");
            let locations = Array.from(locationsString, Number);
            if(locations.includes(locationId) || locations.includes(0) ){ //emp location or all locations
              const holidayObj = {
                "ph_id": holiday.ph_id,
                "ph_name": holiday.ph_name,
                "ph_day": holiday.ph_day,
                "ph_month": holiday.ph_month,
                "ph_year": holiday.ph_year,
                "ph_date": holiday.ph_date,
                "ph_to_date": holiday.ph_to_date,
                "ph_to_day": holiday.ph_to_day,
                "ph_to_month": holiday.ph_to_month,
                "ph_to_year": holiday.ph_to_year,
                "ph_group": holiday.ph_group,
                "ph_archive": holiday.ph_archive,
                "ph_location": holiday.ph_location
              };
              holidayArr.push(holidayObj);
            }
          }
        });
      }
      return res.status(200).json(holidayArr)
    }else{
      return res.status(400).json("Something went wrong. Try again later.")
    }
  } catch (err) {
    return res.status(400).json({message: `Error while fetching public holidays ${err.message}`})
  }
}
const getAllIndividualPublicHolidays = async (req, res) => {
  try {
    const holidays = await PublicHoliday.findAll({
      attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_group', 'ph_month', 'ph_year', 'ph_to_day', 'ph_to_month', 'ph_to_year'],
    });
    return res.status(200).json(holidays)
  } catch (err) {
    return res.status(500).json({message: `Error while fetching public holidays ${err.message}`})
  }
}

const setNewPublicHoliday = async (req, res) => {
  try {
    const schema = Joi.object({
      public_name: Joi.string().required(),
      public_date: Joi.date().required(),
      public_date_to: Joi.date().required(),
      chosen_locations: Joi.array().required(),
    });

    const publicRequest = req.body;
    const { error } = schema.validate(publicRequest);
    if (error) {
      return res.status(400).json(error.details[0].message);
    }

    const locations = req.body.chosen_locations.map((loc) => loc.value);
    //const locations = req.body.chosen_locations.map((loc) => loc);
    const { public_name, public_date, public_date_to } = req.body;
    const startDate = new Date(public_date);
    const endDate = new Date(public_date_to);
    const group = Date.now();

    const holidayArray = [];
    let current = new Date(startDate);

    while (current <= endDate) {
      const loopPub = {
        ph_name: public_name,
        ph_day: current.getUTCDate(),
        ph_month: current.getUTCMonth() + 1,
        ph_year: current.getUTCFullYear(),
        ph_date: new Date(current),
        ph_to_date: endDate,
        ph_to_day: endDate.getUTCDate(),
        ph_to_month: endDate.getUTCMonth() + 1,
        ph_to_year: endDate.getUTCFullYear(),
        ph_group: group,
        ph_location: locations.toString(),
      };

      const created = await PublicHoliday.create(loopPub);
      holidayArray.push(created.ph_id);

      current.setDate(current.getDate() + 1);
    }


    const targetDate = public_date_to;

    const appliedLeaves = await leaveApplicationModel.findAll({
      where: {
        leapp_start_date: { [Op.lte]: targetDate },
        leapp_end_date: { [Op.gte]: targetDate },
      },
    });

    if (appliedLeaves && appliedLeaves.length > 0) {
      await Promise.all(appliedLeaves.map(async (appLeave) => {
        const emp = await getEmployeeByIdOnly(appLeave.leapp_empid);
        if (!emp || !emp.emp_location_id) return;

        const locationId = parseInt(emp.emp_location_id);
        if (locations.includes(locationId) || locations.includes(0)) {
          let numberOfHolidays = await countPublicHolidaysBetweenDatesExcludingWeekends(appLeave.leapp_start_date, appLeave.leapp_end_date);
          let numberOfWeekends =  countWeekendsBetweenDates(appLeave.leapp_start_date, appLeave.leapp_end_date);
          let numberOfDaysBetweenDates = numberOfDays(appLeave.leapp_start_date, appLeave.leapp_end_date)
          const newDuration = numberOfDaysBetweenDates - (numberOfHolidays + numberOfWeekends);
          await leaveApplicationModel.updateLeaveAppDurationLocationHoliday(
            appLeave.leapp_id,
            newDuration,
            emp.emp_location_id,
            holidayArray.toString()
          );

          const leaveExistAccrual = await leaveAccrualModel.getLeaveAccrualByLeaveId(appLeave.leapp_id);
          if (leaveExistAccrual) {
            if (newDuration <= 0) {
              await leaveAccrualModel.deleteLeaveAccrualEntryByLeaveId(appLeave.leapp_id);
            } else {
              await leaveAccrualModel.deleteLeaveAccrualEntryByLeaveId(appLeave.leapp_id);
              await markLeaveApplicationAsFinal(
                appLeave.leapp_start_date,
                appLeave.leapp_end_date,
                appLeave.leapp_empid,
                appLeave.leapp_leave_type,
                appLeave.leapp_id
              );
            }
          }
        }
      }));
    }

    // Log entry
    const logData = {
      log_user_id: req.user.username.user_id,
      log_description: `Log on public holiday: Added a new public holiday`,
      log_date: new Date(),
    };

    await logs.addLog(logData);
    return res.status(200).json(`New public holiday added successfully.`);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: `Something went wrong. Try again later. ${e.message}` });
  }
};


const updatePublicHoliday = async (req, res) => {
  try {
    const schema = Joi.object({
      public_name: Joi.string().required(),
      public_date: Joi.date().required(),
      public_date_to: Joi.date().required(),
      group: Joi.string().required(),
      chosen_locations: Joi.array().required(),
    });

    const { error } = schema.validate(req.body);
    if (error) return res.status(400).json(error.details[0].message);

    const { public_name, public_date, public_date_to, group, chosen_locations } = req.body;
    const existingHoliday = await PublicHoliday.getOnePublicHolidayByGroup(group);
    if (!existingHoliday) return res.status(404).json('Public holiday not found.');

    const oldGroup = existingHoliday.ph_group;
    const oldHolidays = await PublicHoliday.getPublicHolidayByGroup(oldGroup);
    await PublicHoliday.destroyPublicHolidayByGroup(oldGroup);
    const locArray = [];
    const holidayIds = [];
    oldHolidays.forEach(holiday => {
      locArray.push(holiday.ph_location);
      holidayIds.push(holiday.ph_id);
    });
    const distinctLocationIds = [...new Set(
      locArray
        .flatMap(locStr => locStr.split(','))
        .map(id => id.trim())
        .filter(id => id !== '')
    )];
    const locations  = distinctLocationIds.join(',');
    const startDate = new Date(public_date);
    const endDate = new Date(public_date_to);
    const newGroup = Date.now();
    const holidayArray = [1];

    let current = new Date(startDate);
    while (current <= endDate) {
      const loopPub = {
        ph_name: public_name,
        ph_day: current.getUTCDate(),
        ph_month: current.getUTCMonth() + 1,
        ph_year: current.getUTCFullYear(),
        ph_date: new Date(current),
        ph_to_date: endDate,
        ph_to_day: endDate.getUTCDate(),
        ph_to_month: endDate.getUTCMonth() + 1,
        ph_to_year: endDate.getUTCFullYear(),
        ph_group: newGroup,
        ph_location: locations.toString(),
      };

      const created = await PublicHoliday.create(loopPub);
      holidayArray.push(created.ph_id);
      current.setDate(current.getDate() + 1);
    }

    const appliedLeaves = await leaveApplicationModel.findAll({
      where: {
        [Op.or]: [
          { leapp_start_date: { [Op.between]: [public_date, public_date_to] } },
          { leapp_end_date: { [Op.between]: [public_date, public_date_to] } },
        ],
      },
    });

    const previouslyAffectedLeaveApplications = await leaveApplicationModel.findAll({
      where: {
        [Op.or]: holidayIds.map(id => ({
          leapp_holidays: {
            [Op.like]: `%${id}%`
          }
        }))
      }
    });
    if (appliedLeaves?.length > 0) {
      for (const appLeave of appliedLeaves) {
        let offCounter = await countPublicHolidaysBetweenDatesExcludingWeekends(appLeave.leapp_start_date, appLeave.leapp_end_date);
        const emp = await getEmployeeByIdOnly(appLeave.leapp_empid);
        if (!emp?.emp_location_id) continue;

        const locationId = parseInt(emp.emp_location_id);
        if (!locations.includes(locationId) && !locations.includes(0)) continue;

        const leaveStartDate = new Date(appLeave.leapp_start_date);
        const leaveEndDate = new Date(appLeave.leapp_end_date);
        const leaveTotalDays = Math.floor((leaveEndDate - leaveStartDate) / (1000 * 60 * 60 * 24)) + 1;
        let weekendCounter =  countWeekendsBetweenDates(req.body.start, req.body.end);
        const newDuration = (leaveTotalDays - (offCounter + weekendCounter));

        await leaveApplicationModel.updateLeaveAppDurationLocationHoliday(
          appLeave.leapp_id,
          newDuration,
          emp.emp_location_id,
          holidayArray.toString()
        );

        const leaveExistAccrual = await leaveAccrualModel.getLeaveAccrualByLeaveId(appLeave.leapp_id);
        if (leaveExistAccrual) {
          await leaveAccrualModel.deleteLeaveAccrualEntryByLeaveId(appLeave.leapp_id);

          if (newDuration > 0) {
            await markLeaveApplicationAsFinal(
              appLeave.leapp_start_date,
              appLeave.leapp_end_date,
              appLeave.leapp_empid,
              appLeave.leapp_leave_type,
              appLeave.leapp_id
            );
          }
        }
      }
    }
    if (previouslyAffectedLeaveApplications?.length > 0) {
      for (const prev of previouslyAffectedLeaveApplications) {
        let offCounter = await countPublicHolidaysBetweenDatesExcludingWeekends(prev.leapp_start_date, prev.leapp_end_date);
        const emp = await getEmployeeByIdOnly(prev.leapp_empid);
        if (!emp?.emp_location_id) continue;

        const locationId = parseInt(emp.emp_location_id);
        if (!locations.includes(locationId) && !locations.includes(0)) continue;

        const leaveStartDate = new Date(prev.leapp_start_date);
        const leaveEndDate = new Date(prev.leapp_end_date);
        const leaveTotalDays = Math.floor((leaveEndDate - leaveStartDate) / (1000 * 60 * 60 * 24)) + 1;
        let weekendCounter =  countWeekendsBetweenDates(prev.leapp_start_date, prev.leapp_end_date);
        const newDuration = (leaveTotalDays - (offCounter + weekendCounter));

        await leaveApplicationModel.updateLeaveAppDurationLocationHoliday(
          prev.leapp_id,
          newDuration,
          emp.emp_location_id,
          locations.toString(),
        );

        const leaveExistAccrual = await leaveAccrualModel.getLeaveAccrualByLeaveId(prev.leapp_id);
        if (leaveExistAccrual) {
          await leaveAccrualModel.deleteLeaveAccrualEntryByLeaveId(prev.leapp_id);

          if (newDuration > 0) {
            await markLeaveApplicationAsFinal(
              prev.leapp_start_date,
              prev.leapp_end_date,
              prev.leapp_empid,
              prev.leapp_leave_type,
              prev.leapp_id
            );
          }
        }
      }
    }

    await logs.addLog({
      log_user_id: req.user.username.user_id,
      log_description: `Log on public holiday: Added a new public holiday`,
      log_date: new Date(),
    });

    return res.status(200).json('Public holiday changes effected!.');
  } catch (e) {
    console.error('Error in updatePublicHoliday:', e);
    if (!res.headersSent) {
      return res.status(500).json({ message: `Something went wrong. Try again later. ${e.message}` });
    }
  }
};


const getPublicHolidayById = async (req, res) => {
  const holiday_id = req.params.id;
  try {
    const depart = await PublicHoliday.findAll({where: {ph_id: holiday_id}});
    res.status(200).json(depart);
  } catch (e) {
    return res.status(500).json({message: "Something went wrong. Try again later"});
  }
}

async function fetchAllPublicHolidays() {
  return await PublicHoliday.findAll()
}

async function fetchPublicHolidayByYear(year) {
  return await PublicHoliday.findAll({
    where: {
      ph_year: year
    }
  })
}

async function fetchSpecificPublicHoliday(day, month, year) {
  return await PublicHoliday.findAll({
    where: {
      ph_day: day,
      ph_month: month,
      ph_year: year
    }
  })
}


async function fetchPublicHolidayByMonthYear(month, year) {
  return await PublicHoliday.findAll({
    where: {
      ph_month: month,
      ph_year: year
    }
  })
}


function dateRange(startDate, endDate, steps = 1) {
  const dateArray = [];
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    dateArray.push(new Date(currentDate));
    // Use UTC date to prevent problems with time zones and DST
    currentDate.setUTCDate(currentDate.getUTCDate() + steps);
  }
  return dateArray;
}
function numberOfDays(start, end) {
  const leaveStartDate = new Date(start);
  const leaveEndDate = new Date(end);
  return Math.floor((leaveEndDate - leaveStartDate) / (1000 * 60 * 60 * 24)) + 1;
}

const  deletePublicHolidayByGroup = async (req, res) =>{
  try{
    const groupId = req.params.id;
    const pubHols = await PublicHoliday.getPublicHolidayByGroup(groupId);
    const holidayIds = [];
    pubHols.map(hols=>{
      holidayIds.push(hols.ph_id);
    })

    if(_.isNull(pubHols) || _.isEmpty(pubHols)){
      return res.status(400).json("Whoops! No record found.")
    }
    const singlePh = await PublicHoliday.getOnePublicHolidayByGroup(groupId);
    let numOfDays = pubHols.length;
    const endDate = singlePh.ph_to_date;
    const startDate = new Date(new Date().setDate(endDate.getDate() - numOfDays));
    const appliedLeaves = await getAllAppliedLeaves();
    //const appliedLeaves = await getAppliedLeaves(startDate, endDate);
    //let total_period = 0;
    appliedLeaves.map(async leave => {
      if(!(_.isNull(leave.leapp_holidays)) || !(_.isEmpty(leave.leapp_holidays))){
        let leaveHolidayString = leave.leapp_holidays.split(",");
        let leaveHolidays = Array.from(leaveHolidayString, Number);
        let check = holidayIds.some(item => leaveHolidays.includes(item));
        if (check) {
          //add back leave days
          let total_period = leave.leapp_total_days + numOfDays;
          if(total_period > 0){
            const d = new Date(startDate);
            const month = d.getUTCMonth() + 1;
            const year = d.getUTCFullYear();

            const leaveUpdate = await leaveApplicationModel.updateLeaveAppDuration(leave.leapp_id, total_period);
            const accrual = await leaveAccrualModel.updateLeaveAccrualDuration(leave.leapp_id, total_period);
            //const accrual = await leaveAccrualModel.addLeaveAccrual(leave.leapp_empid, month, year, leave.leapp_leave_type, total_period, null);
          }
        }
      }
    });

    const deleteHols =  await PublicHoliday.destroyPublicHolidayByGroup(groupId);
    if(deleteHols){
      //Log
      const logData = {
        "log_user_id": req.user.username.user_id,
        "log_description": `Log on public holiday: Deleted public holiday ${singlePh.ph_name}`,
        "log_date": new Date()
      }
      logs.addLog(logData).then((logRes) => {
        return res.status(200).json(`Public holiday deleted successfully.`);
      });
    }else{
      return res.status(400).json("Could not delete public holiday. Try again later.")
    }
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again. "+e.message)
  }

}
const  archivePublicHolidayByGroup = async (req, res) =>{
  try{
    const groupId = req.params.id;
    const pubHols = await PublicHoliday.getPublicHolidayByGroup(groupId);

    if(_.isNull(pubHols) || _.isEmpty(pubHols)){
      return res.status(400).json("Whoops! No record found.")
    }
    const deleteHols =  await PublicHoliday.archivePublicHolidayByGroup(groupId);
    if(deleteHols){
      return res.status(200).json("Public holiday(s) archived.")
    }else{
      return res.status(400).json("Could not archive public holiday. Try again later.")
    }
  }catch (e) {
    return res.status(400).json("Something went wrong. Try again. "+e.message)
  }

}


async function markLeaveApplicationAsFinal(leapp_start_date, leapp_end_date, leapp_empid, leapp_leave_type, leapp_id){
  try{
    let startDate = new Date(leapp_start_date);
    let endDate = new Date(leapp_end_date);
    //let daysRequested
    const holidays = await PublicHoliday.getThisYearsPublicHolidays()
    const holidaysArray = [];
    holidays.map((pub) => {
      holidaysArray.push(`${pub.ph_year}-${pub.ph_month}-${pub.ph_day}`);
    });
    let validLeaveDates = [];
    const datesWithin = getDatesInRange(startDate, endDate);
    let one = 0, oneDate,
      two = 0, twoDate,
      three = 0, threeDate,
      four = 0, fourDate,
      five = 0, fiveDate,
      six = 0, sixDate,
      seven = 0, sevenDate,
      eight = 0, eightDate,
      nine = 0, nineDate,
      ten = 0, tenDate,
      eleven = 0, elevenDate,
      twelve = 0, twelveDate;
    datesWithin.map((dw)=>{
      if(!(holidaysArray.includes(dw)) && !(isWeekend(new Date(dw))) ){
        validLeaveDates.push(dw);
      }
    });
    validLeaveDates.map(async (vd) => {
      let validDate = new Date(vd);
      let validMonth = validDate.getMonth() + 1;
      switch (parseInt(validMonth)) {
        case 1:
          oneDate = new Date(vd);
          one++;
          break;
        case 2:
          twoDate = new Date(vd);
          two++;
          break;
        case 3:
          threeDate = new Date(vd);
          three++;
          break;
        case 4:
          fourDate = new Date(vd);
          four++;
          break;
        case 5:
          fiveDate = new Date(vd);
          five++;
          break;
        case 6:
          sixDate = new Date(vd);
          six++;
          break;
        case 7:
          sevenDate = new Date(vd);
          seven++;
          break;
        case 8:
          eightDate = new Date(vd);
          eight++;
          break;
        case 9:
          nineDate = new Date(vd);
          nine++;
          break;
        case 10:
          tenDate = new Date(vd);
          ten++;
          break;
        case 11:
          elevenDate = new Date(vd);
          eleven++;
          break;
        case 12:
          twelveDate = new Date(vd);
          twelve++;


      }
    });
    holidays.map((pub) => {
      holidaysArray.push(`${pub.ph_year}-${pub.ph_month}-${pub.ph_day}`);
    });
    //Insert individually
    for(let m = 1; m<= 12; m++){
      let number = parseInt(m);
      if (number === 1) {
        if (one > 0) {
          await addToLeaveAccrual(leapp_empid, oneDate.getFullYear(), oneDate.getMonth() + 1, leapp_leave_type, one, leapp_id);
        }
      }else if (number === 2) {
        if (two > 0) {
          await addToLeaveAccrual(leapp_empid, twoDate.getFullYear(), twoDate.getMonth() + 1, leapp_leave_type, two, leapp_id);
        }
      }else if (number === 3) {
        if (three > 0) {
          await addToLeaveAccrual(leapp_empid, threeDate.getFullYear(), threeDate.getMonth() + 1, leapp_leave_type, three, leapp_id);
        }
      }else if (number === 4) {
        if (four > 0) {
          await addToLeaveAccrual(leapp_empid, fourDate.getFullYear(), fourDate.getMonth() + 1, leapp_leave_type, four, leapp_id);
        }
      }else if (number === 5) {
        if (five > 0) {
          await addToLeaveAccrual(leapp_empid, fiveDate.getFullYear(), fiveDate.getMonth() + 1, leapp_leave_type, five, leapp_id);
        }
      }else if (number === 6) {
        if (six > 0) {
          await addToLeaveAccrual(leapp_empid, sixDate.getFullYear(), sixDate.getMonth() + 1, leapp_leave_type, six, leapp_id);
        }
      }else if (number === 7) {
        if (seven > 0) {
          await addToLeaveAccrual(leapp_empid, sevenDate.getFullYear(), sevenDate.getMonth() + 1, leapp_leave_type, seven, leapp_id);
        }
      }else if (number === 8) {
        if (eight > 0) {
          await addToLeaveAccrual(leapp_empid, eightDate.getFullYear(), eightDate.getMonth() + 1, leapp_leave_type, eight, leapp_id);
        }
      }else if (number === 9) {
        if (nine > 0) {
          await addToLeaveAccrual(leapp_empid, nineDate.getFullYear(), nineDate.getMonth() + 1, leapp_leave_type, nine, leapp_id);
        }
      }else if (number === 10) {
        if (ten > 0) {
          await addToLeaveAccrual(leapp_empid, tenDate.getFullYear(), tenDate.getMonth() + 1, leapp_leave_type, ten, leapp_id);
        }
      } else if (number === 11) {
        if (eleven > 0) {
          await addToLeaveAccrual(leapp_empid, elevenDate.getFullYear(), elevenDate.getMonth() + 1, leapp_leave_type, eleven, leapp_id);
        }
      } else if (number === 12) {
        if (twelve > 0) {
          await addToLeaveAccrual(leapp_empid, twelveDate.getFullYear(), twelveDate.getMonth() + 1, leapp_leave_type, twelve, leapp_id);
        }
      }
    }
  }catch (e) {
    console.log(e)
  }
}
async function addToLeaveAccrual(empId, year, month, leaveType, noDays, leaveId) {
  const calendarYear = parseInt(month) <= 9 ? `FY${year}` : `FY${year + 1}`;
  /*const val = {
    lea_emp_id: parseInt(empId),
    lea_year: parseInt(year),
    lea_month: parseInt(month),
    lea_leave_type: parseInt(leaveType),
    lea_rate: 0 - parseInt(noDays),
    lea_archives: 0,
    lea_leaveapp_id: leaveId,
    lea_expires_on: '1900-01-01',
    lea_fy: calendarYear,
    leave_narration: `${noDays} deducted from accrued leaves`,
  }
  */
  const addAccrualResponse = await leaveAccrualModel.updateLeaveAccrual(empId, month, year, leaveType, (0 - noDays), '1900-01-01', leaveId).then((data) => {
    return data
  });
}

function getDatesInRange(startDate, endDate) {
  const date = new Date(startDate.getTime());
  const dates = [];


  while (date <= endDate) {
    if(isWeekend(date)){
    }
    let newDate = new Date(date);
    let formattedNewDate = `${newDate.getFullYear()}-${newDate.getMonth()+1}-${newDate.getDate()}`;
    dates.push(formattedNewDate);
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

async function getAppliedLeaves(start, end) {
  return await leaveApplicationModel.findAll({
    where: {
      leapp_start_date: {
        [Op.between]: [start, end]
      },
      leapp_end_date: {
        [Op.between]: [start, end]
      },
    },
  });
}
async function getAllAppliedLeaves() {
  return await leaveApplicationModel.findAll();
}


function removeDuplicates(arr) {
  return arr.filter((item,
                     index) => arr.indexOf(item) === index);
}


const durationCounter = async (req, res) => {
  try {
    let counter = await countPublicHolidaysBetweenDatesExcludingWeekends(req.body.start, req.body.end);
    let weekendCounter =  countWeekendsBetweenDates(req.body.start, req.body.end);
    let days = numberOfDays(req.body.start, req.body.end)
    return res.status(200).json(`Number of holidays: ${counter}, Weekends: ${weekendCounter}, Number of Days: ${days}, Duration: ${days - (counter + weekendCounter)}`);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: `Something went wrong. Try again later. ${e.message}` });
  }
};


function countWeekendsBetweenDates(startDate, endDate) {
  try {
    let count = 0;
    let current = new Date(startDate);
    const end = new Date(endDate);
    current.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      const day = current.getDay();
      if (day === 0 || day === 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  } catch (err) {
    console.error("Error counting weekends:", err);
    return 0;
  }
}


async function countPublicHolidaysBetweenDatesExcludingWeekends(startDate, endDate) {
  try {
    const holidays = await PublicHoliday.findAll({
      where: {
        ph_date: {
          [Op.gte]: new Date(startDate),
          [Op.lte]: new Date(endDate),
        },
      },
      attributes: ['ph_date'],
    });

    //console.log("Holiday Array Length:: ");
    if (!holidays || holidays.length === 0) {
      return 0;
    }

    const weekdayHolidays = holidays.filter(holiday => {
      const dayOfWeek = new Date(holiday.ph_date).getDay();
      return dayOfWeek !== 0 && dayOfWeek !== 6;
    });

    return weekdayHolidays.length || 0;
  } catch (err) {
    console.error('Error counting public holidays excluding weekends:', err);
    return 0;
  }
}


module.exports = {
  setNewPublicHoliday,
  getAllPublicHolidays,
  getPublicHolidayById,
  fetchAllPublicHolidays,
  fetchPublicHolidayByYear,
  fetchSpecificPublicHoliday,
  updatePublicHoliday,
  getAllIndividualPublicHolidays,
  deletePublicHolidayByGroup,
  archivePublicHolidayByGroup,
  getCurrentYearPublicHolidays,
  getCurrentYearPublicHolidaysByLocation,
  durationCounter
}
