"use strict";

async function indexExists(queryInterface, tableName, indexName) {
  const indexes = await queryInterface.showIndex(tableName);
  return indexes.some((index) => index.name === indexName);
}

async function runMysqlIndex(queryInterface, sql, tableName, indexName) {
  if (!(await indexExists(queryInterface, tableName, indexName))) {
    await queryInterface.sequelize.query(sql);
  }
}

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const dialect = sequelize.getDialect();
    const isMysql = dialect === "mysql" || dialect === "mariadb";

    if (isMysql) {
      // Month/year/day/ref columns are stored as TEXT in this schema.
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ts_emp_period_day ON time_sheets (ts_emp_id, ts_month(4), ts_year(4), ts_day(2))",
        "time_sheets",
        "idx_ts_emp_period_day"
      );
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ts_emp_period_status ON time_sheets (ts_emp_id, ts_month(4), ts_year(4), ts_status)",
        "time_sheets",
        "idx_ts_emp_period_status"
      );
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ts_ref_no ON time_sheets (ts_ref_no(32))",
        "time_sheets",
        "idx_ts_ref_no"
      );
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ta_emp_id ON time_allocations (ta_emp_id, ta_id)",
        "time_allocations",
        "idx_ta_emp_id"
      );
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ta_ref_no ON time_allocations (ta_ref_no(32))",
        "time_allocations",
        "idx_ta_ref_no"
      );
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ta_status_id ON time_allocations (ta_status, ta_id)",
        "time_allocations",
        "idx_ta_status_id"
      );
      await runMysqlIndex(
        queryInterface,
        "CREATE INDEX idx_ph_day_month_year ON public_holidays (ph_day, ph_month, ph_year)",
        "public_holidays",
        "idx_ph_day_month_year"
      );
      return;
    }

    const addIndexIfMissing = async (tableName, fields, name) => {
      if (!(await indexExists(queryInterface, tableName, name))) {
        await queryInterface.addIndex(tableName, fields, { name });
      }
    };

    await addIndexIfMissing(
      "time_sheets",
      ["ts_emp_id", "ts_month", "ts_year", "ts_day"],
      "idx_ts_emp_period_day"
    );
    await addIndexIfMissing(
      "time_sheets",
      ["ts_emp_id", "ts_month", "ts_year", "ts_status"],
      "idx_ts_emp_period_status"
    );
    await addIndexIfMissing("time_sheets", ["ts_ref_no"], "idx_ts_ref_no");
    await addIndexIfMissing("time_allocations", ["ta_emp_id", "ta_id"], "idx_ta_emp_id");
    await addIndexIfMissing("time_allocations", ["ta_ref_no"], "idx_ta_ref_no");
    await addIndexIfMissing(
      "time_allocations",
      ["ta_status", "ta_id"],
      "idx_ta_status_id"
    );
    await addIndexIfMissing(
      "public_holidays",
      ["ph_day", "ph_month", "ph_year"],
      "idx_ph_day_month_year"
    );
  },

  async down(queryInterface) {
    const tables = [
      ["time_sheets", "idx_ts_emp_period_day"],
      ["time_sheets", "idx_ts_emp_period_status"],
      ["time_sheets", "idx_ts_ref_no"],
      ["time_allocations", "idx_ta_emp_id"],
      ["time_allocations", "idx_ta_ref_no"],
      ["time_allocations", "idx_ta_status_id"],
      ["public_holidays", "idx_ph_day_month_year"],
    ];

    for (const [tableName, indexName] of tables) {
      if (await indexExists(queryInterface, tableName, indexName)) {
        await queryInterface.removeIndex(tableName, indexName);
      }
    }
  },
};
