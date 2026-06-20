const _ = require('lodash');
const paymentDefinition = require('./paymentDefinitionService');
const employee = require('./employeeService');
const locationService = require('./locationService');
const salary = require('./salaryService');
const departmentService = require('./departmentService');
const jobRoleService = require('./jobRoleService');

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function decodePayslipLinkData(dataParam) {
  if (!dataParam || typeof dataParam !== 'string') {
    throw new Error('Invalid payslip link');
  }

  let decoded;
  try {
    decoded = JSON.parse(Buffer.from(dataParam, 'base64').toString('utf8'));
  } catch {
    throw new Error('Invalid payslip link');
  }

  const empId = parseInt(decoded.employee ?? decoded.empId ?? decoded.emp_id, 10);
  const month = parseInt(decoded.month, 10);
  const year = parseInt(decoded.year, 10);

  if (!empId || !month || !year) {
    throw new Error('Invalid payslip link');
  }

  return { empId, month, year };
}

function encodePayslipLinkData(empId, month, year) {
  return Buffer.from(
    JSON.stringify({
      employee: parseInt(empId, 10),
      month: parseInt(month, 10),
      year: parseInt(year, 10)
    })
  ).toString('base64');
}

function formatAmount(value) {
  const amount = parseFloat(value || 0);
  return amount.toLocaleString('en-NG', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function getEmployeePayslip(empId, payrollMonth, payrollYear, options = {}) {
  const { requireApproved = true } = options;

  const nsitfPayments = await paymentDefinition.getNsitfPayments();
  if (_.isNull(nsitfPayments) || _.isEmpty(nsitfPayments)) {
    throw new Error('No payments marked as nsift');
  }

  const pensionPayments = await paymentDefinition.getPensionPayments();
  if (_.isNull(pensionPayments) || _.isEmpty(pensionPayments)) {
    throw new Error('No payments marked as pension');
  }

  const salaryRoutineCheck = await salary.getSalaryMonthYear(
    parseInt(payrollMonth, 10),
    parseInt(payrollYear, 10)
  );

  if (_.isNull(salaryRoutineCheck) || _.isEmpty(salaryRoutineCheck)) {
    throw new Error('Payroll routine has not been run for this period');
  }

  const emp = await employee.getEmployee(parseInt(empId, 10));
  if (_.isEmpty(emp) || _.isNull(emp)) {
    throw new Error('Employee not found');
  }

  let grossSalary = 0;
  let netSalary = 0;
  let totalDeduction = 0;
  const deductions = [];
  const incomes = [];
  const employersIncomes = [];
  const employersDeductions = [];
  let totalPension = 0;
  let totalNsitf = 0;

  const employeeSalaries = await salary.getEmployeeSalary(
    payrollMonth,
    payrollYear,
    emp.emp_id
  );

  if (_.isNull(employeeSalaries) || _.isEmpty(employeeSalaries)) {
    throw new Error('No salary record found for this employee and period');
  }

  if (requireApproved && parseInt(employeeSalaries[0].salary_approved, 10) === 0) {
    throw new Error('Salary for this month has not been approved');
  }

  for (const empSalary of employeeSalaries) {
    if (parseInt(empSalary.payment.pd_employee, 10) === 1) {
      if (parseInt(empSalary.payment.pd_payment_type, 10) === 1) {
        incomes.push({
          paymentName: empSalary.payment.pd_payment_name,
          amount: empSalary.salary_amount
        });
        grossSalary += parseFloat(empSalary.salary_amount);
      } else {
        deductions.push({
          paymentName: empSalary.payment.pd_payment_name,
          amount: empSalary.salary_amount
        });
        totalDeduction += parseFloat(empSalary.salary_amount);
      }
    }

    if (parseInt(empSalary.payment.pd_employee, 10) === 2) {
      if (parseInt(empSalary.payment.pd_payment_type, 10) === 1) {
        employersIncomes.push({
          paymentName: empSalary.payment.pd_payment_name,
          amount: empSalary.salary_amount
        });
      } else {
        employersDeductions.push({
          paymentName: empSalary.payment.pd_payment_name,
          amount: empSalary.salary_amount
        });
      }
    }
  }

  netSalary = grossSalary - totalDeduction;

  let empJobRole = 'N/A';
  if (parseInt(employeeSalaries[0].salary_jobrole_id, 10) > 0) {
    const jobRole = await jobRoleService.findJobRoleById(employeeSalaries[0].salary_jobrole_id);
    empJobRole = jobRole.job_role;
  }

  let sectorName = 'N/A';
  if (parseInt(employeeSalaries[0].salary_department_id, 10) > 0) {
    const sector = await departmentService.findDepartmentById(
      employeeSalaries[0].salary_department_id
    );
    sectorName = `${sector.department_name} - ${sector.d_t3_code}`;
  }

  let locationName = 'N/A';
  const locationId = employeeSalaries[0].salary_location_id;
  if (parseInt(employeeSalaries[0].salary_location_id, 10) > 0) {
    const location = await locationService.findLocationById(employeeSalaries[0].salary_location_id);
    locationName = `${location.location_name} - ${location.l_t6_code}`;
  }

  for (const pensionPayment of pensionPayments) {
    const checkSalary = await salary.getEmployeeSalaryMonthYearPd(
      payrollMonth,
      payrollYear,
      emp.emp_id,
      pensionPayment.pd_id
    );

    if (
      parseInt(pensionPayment.pd_employee, 10) === 2 &&
      !(_.isNull(checkSalary) || _.isEmpty(checkSalary))
    ) {
      totalPension += parseFloat(checkSalary.salary_amount);
    }
  }

  for (const nsitfPayment of nsitfPayments) {
    const checkSalary = await salary.getEmployeeSalaryMonthYearPd(
      payrollMonth,
      payrollYear,
      emp.emp_id,
      nsitfPayment.pd_id
    );

    if (!(_.isNull(checkSalary) || _.isEmpty(checkSalary))) {
      totalNsitf += parseFloat(checkSalary.salary_amount);
    }
  }

  return {
    employeeId: emp.emp_id,
    employeeName: `${emp.emp_first_name} ${emp.emp_last_name}`,
    employeeUniqueId: emp.emp_unique_id,
    location: locationName,
    locationId,
    jobRole: empJobRole,
    sector: sectorName,
    grossSalary,
    nsitf: totalNsitf,
    pension: totalPension,
    employersDeductions,
    employersIncomes,
    totalDeduction,
    netSalary,
    incomes,
    deductions,
    month: parseInt(payrollMonth, 10),
    year: parseInt(payrollYear, 10)
  };
}

function renderLineItems(items) {
  if (!items.length) {
    return '<tr><td colspan="2">No items</td></tr>';
  }

  return items
    .map(
      (item) => `
        <tr>
          <td>${escapeHtml(item.paymentName)}</td>
          <td style="text-align:right;">=N= ${formatAmount(item.amount)}</td>
        </tr>`
    )
    .join('');
}

function renderPublicPayslipHtml(payslipData) {
  const monthLabel = MONTHS[payslipData.month - 1] || payslipData.month;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Employee Payslip - ${escapeHtml(monthLabel)} ${escapeHtml(payslipData.year)}</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; color: #333; }
    .container { max-width: 900px; margin: 0 auto; background: #fff; padding: 24px; border: 1px solid #ddd; }
    h1, h2, h3 { margin: 0 0 12px; }
    .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; margin: 24px 0; }
    .meta div { display: flex; justify-content: space-between; gap: 16px; border-bottom: 1px solid #eee; padding: 8px 0; }
    .columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border-bottom: 1px solid #eee; padding: 8px 4px; text-align: left; }
    th { font-size: 12px; text-transform: uppercase; color: #666; }
    .totals { margin-top: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
    .totals div { display: flex; justify-content: space-between; padding: 8px 0; border-top: 1px solid #ddd; }
    .net { font-weight: bold; font-size: 18px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Employee Pay Slip (${escapeHtml(monthLabel)} ${escapeHtml(payslipData.year)})</h1>
    <p>International Rescue Committee, Nigeria.</p>

    <div class="meta">
      <div><strong>Name</strong><span>${escapeHtml(payslipData.employeeName)}</span></div>
      <div><strong>T7 Number</strong><span>${escapeHtml(payslipData.employeeUniqueId)}</span></div>
      <div><strong>Sector (T3)</strong><span>${escapeHtml(payslipData.sector)}</span></div>
      <div><strong>Location (T6)</strong><span>${escapeHtml(payslipData.location)}</span></div>
      <div><strong>Designation</strong><span>${escapeHtml(payslipData.jobRole)}</span></div>
      <div><strong>Reference</strong><span>---</span></div>
    </div>

    <div class="columns">
      <div>
        <h2>Entitlements</h2>
        <table>
          <thead><tr><th>Salary Item</th><th style="text-align:right;">Amount</th></tr></thead>
          <tbody>${renderLineItems(payslipData.incomes)}</tbody>
        </table>
      </div>
      <div>
        <h2>Deductions</h2>
        <table>
          <thead><tr><th>Salary Item</th><th style="text-align:right;">Amount</th></tr></thead>
          <tbody>${renderLineItems(payslipData.deductions)}</tbody>
        </table>
      </div>
    </div>

    <div class="totals">
      <div><strong>Gross Pay</strong><span>=N= ${formatAmount(payslipData.grossSalary)}</span></div>
      <div><strong>Total Deductions</strong><span>=N= ${formatAmount(payslipData.totalDeduction)}</span></div>
      <div class="net"><strong>Net Pay</strong><span>=N= ${formatAmount(payslipData.netSalary)}</span></div>
    </div>

    ${
      payslipData.employersIncomes.length
        ? `<h3 style="margin-top:24px;">Employer Contributions</h3>
        <table>
          <thead><tr><th>Salary Item</th><th style="text-align:right;">Amount</th></tr></thead>
          <tbody>${renderLineItems(payslipData.employersIncomes)}</tbody>
        </table>`
        : ''
    }
  </div>
</body>
</html>`;
}

function renderPayslipErrorHtml(message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Payslip Unavailable</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 24px; }
    .container { max-width: 640px; margin: 40px auto; background: #fff; padding: 24px; border: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Payslip Unavailable</h1>
    <p>${escapeHtml(message)}</p>
  </div>
</body>
</html>`;
}

function buildPayslipViewUrl(urlString) {
  const configured = process.env.PAYSLIP_VIEW_URL;
  if (configured) {
    if (configured.includes('{{urlString}}')) {
      return configured.replace('{{urlString}}', urlString);
    }
    const separator = configured.includes('?') ? '&' : '?';
    return `${configured}${separator}data=${encodeURIComponent(urlString)}`;
  }

  const apiBase = (process.env.API_PUBLIC_URL || 'https://api.ircng.org').replace(/\/$/, '');
  return `${apiBase}/salary/public-payslip?data=${encodeURIComponent(urlString)}`;
}

module.exports = {
  decodePayslipLinkData,
  encodePayslipLinkData,
  getEmployeePayslip,
  renderPublicPayslipHtml,
  renderPayslipErrorHtml,
  buildPayslipViewUrl
};
