const {QueryTypes, Op} = require('sequelize')
const Joi = require('joi')
const _ = require('lodash');
const isBefore = require('date-fns/isBefore')
const {sequelize, Sequelize} = require('./db');
const PublicHoliday = require("../models/PublicHoliday")(sequelize, Sequelize.DataTypes);
const logs = require('../services/logService')
const leaveApplicationModel = require("../models/leaveapplication")(sequelize, Sequelize.DataTypes);
const leaveAccrualModel = require("../models/leaveaccrual")(sequelize, Sequelize.DataTypes);

const helper = require('../helper');
const {getEmployeeByIdOnly} = require("./employeeService");
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
            //public_location: Joi.number().default(0),
        })
        const publicRequest = req.body
        const validationResult = schema.validate(publicRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }
        const locations = req.body.chosen_locations;
        const locationArray = [];
        locations.map((locate)=>{
          locationArray.push(locate.value);
        });

        const {public_name, public_date, public_date_to } = req.body;
        const date = new Date(public_date);
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();

        const to_date = new Date(public_date_to);
        const to_day = to_date.getUTCDate();
        const to_month = to_date.getUTCMonth() + 1;
        const to_year = to_date.getUTCFullYear();

        const numDays = dateRange(date, to_date).length; // (to_date.getTime() - date.getTime())/(1000*60*60*24);
        //return res.status(400).json(`${day+1}`);



       /* const existPeriod = await PublicHoliday.findOne({
            attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_month', 'ph_year'],
            where: {
                ph_day: day,
                ph_month: month,
                ph_year: year
            }
        });

        if (existPeriod) return res.status(400).json("There's an existing public holiday with these entry.");*/
        const group = new Date().valueOf(); // Math.floor(Math.random() * 1001);
      const pubData = {
            ph_name: public_name,
            ph_day: day,
            ph_month: month,
            ph_year: year,
            ph_date: public_date,
            //ph_location: public_location,
            ph_location: locationArray.toString(),
            ph_to_date: public_date_to,
            ph_to_day: to_day,
            ph_to_month: to_month,
            ph_to_year: to_year,
            ph_group: group,
        };
        let i = 0;
        const holidayArray = [];
          if(numDays > 1) {
            let startDateFormat = `${month}/${day}/${year}`;
            let endDateFormat = `${to_month}/${to_day}/${to_year}`;
            const start = new Date(startDateFormat);
            const end = new Date(endDateFormat);
            let loop = new Date(start);
            while (loop <= end) {
              //console.log(loop);
              let newDate = loop.setDate(loop.getDate() + i);
              loop = new Date(newDate);
            //for(i=0; i<= numDays; i++){
            const loopPub = {
              ph_day: loop.getUTCDate(),// i === 0 ? day : (day + i),
              ph_date: loop, //i === 0 ? date : date.getTime() + (i * 24 * 60 * 60 * 1000),
              ph_to_date: public_date_to,
              ph_to_day: to_day,
              ph_name: public_name,
              ph_month: loop.getUTCMonth() + 1,
              ph_to_month: to_month,
              ph_to_year: to_year,
              ph_year: year,
              ph_group: group,
              ph_location: locationArray.toString(),
            }
            let pub = await PublicHoliday.create(loopPub)
              holidayArray.push(pub.ph_id)
              //.catch(errHandler);
          }
            //}
          }else{
            let sPub = await PublicHoliday.create(pubData)
             // .catch(errHandler);
            holidayArray.push(sPub.ph_id)
          }

          //Check existing leave applications within the newly added public holiday period
        const appliedLeaves = await leaveApplicationModel.findAll({
          where:{
          /*  leapp_start_date: {
              [Op.between]:[public_date,public_date_to]
            },
            leapp_end_date: {
              [Op.between]:[public_date,public_date_to]
            },*/
            leapp_end_date: {[Op.lte]:public_date_to},
            leapp_end_date: {[Op.gte]:public_date_to}
          },
        });
          //console.log(appliedLeaves)
          /*console.log('Start: '+public_date);
          console.log('End: '+public_date_to);
          console.log('updating leave...');
          console.log(appliedLeaves);*/
          if(!(_.isNull(appliedLeaves)) || !(_.isEmpty(appliedLeaves))){
            appliedLeaves.map(async appLeave => {
              let emp = await getEmployeeByIdOnly(appLeave.leapp_empid);
              if(_.isNull(emp) || _.isEmpty(emp)){
                return res.status(400).json("Leave application process aborted!");
              }
              let locationId = emp.emp_location_id;
              if(_.isNull(locationId) || _.isEmpty(locationId)){
                return res.status(400).json("Employee location not found!");
              }
             // if(!(_.isNull(appLeave.leapp_locations)) || !(_.isEmpty(appLeave.leapp_locations))){

                if(locationArray.includes(parseInt(locationId)) || locationArray.includes(0) ){
                  let newDuration = parseInt(appLeave.leapp_total_days) - numDays;
                  if(newDuration <= 0){
                    await leaveApplicationModel.deleteLeaveApplication(appLeave.leapp_id);
                  }else{
                    await leaveApplicationModel.updateLeaveAppDurationLocationHoliday(appLeave.leapp_id, newDuration, emp.location_id, /*locationArray.toString()*/ holidayArray.toString());
                  }
                  //check if it exist in leave accrual table
                  const leaveExistAccrual = await leaveAccrualModel.getLeaveAccrualByLeaveId(appLeave.leapp_id);
                  if(!(_.isNull(leaveExistAccrual)) || !(_.isEmpty(leaveExistAccrual))){
                    if(newDuration <= 0){
                      await leaveAccrualModel.deleteLeaveAccrualEntryByLeaveId(appLeave.leapp_id)
                    }else{
                      //update lea_rate
                      await leaveAccrualModel.updateLeaveAccrualDuration(appLeave.leapp_id, newDuration);
                    }
                  }
                }
              //}


            });

            /* appliedLeaves.map(async appLeave => {
               let newDuration = parseInt(appLeave.leapp_total_days) - numDays;
                await leaveApplicationModel.updateLeaveAppDuration(appLeave.leapp_id, newDuration);
                //check if it exist in leave accrual table
               const leaveExistAccrual = await leaveAccrualModel.getLeaveAccrualByLeaveId(appLeave.leapp_id);
               if(!(_.isNull(leaveExistAccrual)) || !(_.isEmpty(leaveExistAccrual))){
                 //update lea_rate
                 await leaveAccrualModel.updateLeaveAccrualDuration(appLeave.leapp_id, newDuration);
               }
             });*/
          }
        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on public holiday: Added a new public holiday`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`New public holiday added successfully.`);
        });
    } catch (e) {
        return res.status(500).json({message: "Something went wrong. Try again later." + e.message});
        ;

    }
}
const updatePublicHoliday = async (req, res) => {
    try {
        const publicHolidayId = req.params.id;
        const schema = Joi.object({
            public_name: Joi.string().required(),
            public_date: Joi.date().required(),
            public_date_to: Joi.date().required(),
            group: Joi.string().required(),
        })
        const publicRequest = req.body
        const validationResult = schema.validate(publicRequest)

        if (validationResult.error) {
            return res.status(400).json(validationResult.error.details[0].message)
        }

        //const { public_name, public_day, public_month, public_year} = req.body;
        const {public_name, public_date, public_date_to} = req.body;
        let startDate = new Date(public_date);
        let endDate = new Date(public_date_to);
        if (isBefore(startDate, new Date())) {
            return res.status(400).json('Start date cannot be before today or today.')
        }
        if (isBefore(endDate, new Date())) {
            return res.status(400).json('End date cannot be before today or today')
        }
        const date = new Date(public_date);
        const day = date.getUTCDate();
        const month = date.getUTCMonth() + 1;
        const year = date.getUTCFullYear();

        const to_date = new Date(public_date_to);
        const to_day = to_date.getUTCDate();
        const to_month = to_date.getUTCMonth() + 1;
        const to_year = to_date.getUTCFullYear();
        const pubData = {
            ph_name: public_name,
            ph_day: day,
            ph_month: month,
            ph_year: year,
            ph_date: public_date,

            ph_to_date: public_date_to,
            ph_to_day: to_day,
            ph_to_month: to_month,
            ph_to_year: to_year,
        };
        const publicHols = await PublicHoliday.getPublicHolidayByGroup(req.body.group);
        //return res.status(400).json(publicHols);
        if(!(_.isNull(publicHols)) || !(_.isEmpty(publicHols))){
            await PublicHoliday.destroyPublicHolidayByGroup(req.body.group);
        }/*else{
          const updateRecord = await PublicHoliday.update(
            pubData,
            {
              where: {
                ph_id: publicHolidayId
              }
            });
          if (!updateRecord) return res.status(400).json("There's an existing public holiday with these entry.");
        }*/
      const numDays = (to_date.getTime() - date.getTime())/(1000*60*60*24);
      //return res.status(400).json(numDays);



      /* const existPeriod = await PublicHoliday.findOne({
           attributes: ['ph_id', 'ph_name', 'ph_day', 'ph_month', 'ph_year'],
           where: {
               ph_day: day,
               ph_month: month,
               ph_year: year
           }
       });

       if (existPeriod) return res.status(400).json("There's an existing public holiday with these entry.");*/
      const group = Math.floor(Math.random() * 1001);
      let i = 0;
      if(numDays > 0){
        for(i=0; i<= numDays; i++){
          const loopPub = {
            ph_day: i === 0 ? day : (day + i) ,
            ph_date: i === 0 ? date : date.getTime() + (i*24*60*60*1000) ,
            ph_to_date: public_date_to,
            ph_to_day: to_day,
            ph_name: public_name,
            ph_month: month,
            ph_to_month: to_month,
            ph_to_year: to_year,
            ph_year: year,
            ph_group: group,
          }
          await PublicHoliday.create(loopPub)
            .catch(errHandler);
        }
      }else{
        await PublicHoliday.create(pubData)
          .catch(errHandler);
      }
        //console.log(public_date_to);
        //return res.status(200).json(public_date_to);


        //Log
        const logData = {
            "log_user_id": req.user.username.user_id,
            "log_description": `Log on public holiday: Added a new public holiday`,
            "log_date": new Date()
        }
        logs.addLog(logData).then((logRes) => {
            return res.status(200).json(`New public holiday added successfully.`);
        });
    } catch (e) {
        return res.status(400).json("Something went wrong. Try again later." + e.message);

    }
}


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
  getCurrentYearPublicHolidaysByLocation
}
