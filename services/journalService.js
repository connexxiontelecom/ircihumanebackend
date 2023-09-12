const { sequelize, Sequelize } = require('./db');
const Journal = require('../models/journal')(sequelize, Sequelize.DataTypes);

async function addJournal(journal) {
  return await Journal.create({
    j_acc_code: journal.j_acc_code,
    j_date: journal.j_date,
    j_ref_code: journal.j_ref_code,
    j_d_c: journal.j_d_c,
    j_desc: journal.j_desc,
    j_amount: journal.j_amount,
    j_t1: journal.j_t1,
    j_t2: journal.j_t2,
    j_t3: journal.j_t3,
    j_t4: journal.j_t4,
    j_t5: journal.j_t5,
    j_t6: journal.j_t6,
    j_t7: journal.j_t7,
    j_month: journal.j_month,
    j_year: journal.j_year,
    j_name: journal.j_name,
    j_vendor_account: journal.j_vendor_account
  });
}

async function removeJournalByRefCode(refCode) {
  return await Journal.destroy({
    where: {
      j_ref_code: refCode
    }
  });
}
async function getJournalByRefCode(refCode) {
  return await Journal.findAll({
    where: {
      j_ref_code: refCode
    }
  });
}

module.exports = {
  addJournal,
  removeJournalByRefCode,
  getJournalByRefCode
};
