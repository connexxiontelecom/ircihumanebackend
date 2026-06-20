const path = require('path');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-handlebars');
const dotenv = require('dotenv');
const payslipService = require('./payslipService');

dotenv.config();

const smtpPort = Number(process.env.SMTP_PORT) || 587;
// Port 465 requires implicit TLS unless explicitly disabled
const smtpSecure =
  process.env.SMTP_SECURE === 'true' ||
  (process.env.SMTP_SECURE !== 'false' && smtpPort === 465);

const MAIL_SEND_TIMEOUT_MS = Number(process.env.MAIL_SEND_TIMEOUT_MS) || 12000;

const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 15000
});

const handlebarOptions = {
  viewEngine: {
    extName: '.handlebars',
    partialsDir: path.resolve('email_views'),
    defaultLayout: false
  },
  viewPath: path.resolve('email_views'),
  extName: '.handlebars'
};

transport.use('compile', hbs(handlebarOptions));

function getDefaultFrom(from) {
  return from || process.env.MAIL_FROM || 'noreply@ircng.org';
}

function assertRecipient(to) {
  if (!to || typeof to !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to.trim())) {
    const err = new Error('Invalid or missing email recipient');
    err.code = 'INVALID_RECIPIENT';
    throw err;
  }
}

function sendWithTimeout(promise, ms = MAIL_SEND_TIMEOUT_MS) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => {
        const err = new Error(`Email send timed out after ${ms}ms`);
        err.code = 'MAIL_TIMEOUT';
        reject(err);
      }, ms);
    })
  ]);
}

async function sendTemplatedMail({ from, to, subject, template, context = {}, text }) {
  assertRecipient(to);
  const message = {
    from: getDefaultFrom(from),
    to: to.trim(),
    subject,
    template,
    context
  };
  if (text) {
    message.text = text;
  }
  return sendWithTimeout(transport.sendMail(message));
}

async function sendMail(from, to, subject, text, context = {}) {
  return sendTemplatedMail({
    from,
    to,
    subject,
    template: 'notificationByEmail',
    text: text || subject,
    context: {
      firstName: context.firstName || '',
      title: context.title || subject
    }
  });
}

async function paySlipSendMail(from, to, subject, templateParams) {
  const payslipLink = payslipService.buildPayslipViewUrl(templateParams.urlString);

  return sendTemplatedMail({
    from,
    to,
    subject,
    template: 'payslipnotification',
    context: {
      monthYear: templateParams.monthYear,
      name: templateParams.name,
      department: templateParams.department,
      jobRole: templateParams.jobRole,
      employeeId: templateParams.employeeId,
      monthNumber: templateParams.monthNumber,
      yearNumber: templateParams.yearNumber,
      urlString: templateParams.urlString,
      payslipLink
    }
  });
}

async function journalProcessedSendMail(from, to, subject, templateParams) {
  return sendTemplatedMail({
    from,
    to,
    subject,
    template: 'journalnotification',
    context: {
      monthYear: templateParams.monthYear,
      name: templateParams.name,
      monthNumber: templateParams.monthNumber,
      yearNumber: templateParams.yearNumber,
      department: templateParams.department,
      jobRole: templateParams.jobRole,
      employeeId: templateParams.employeeId
    }
  });
}

async function resetPasswordSendMail(from, to, subject, templateParams) {
  return sendTemplatedMail({
    from,
    to,
    subject,
    template: 'resetpassword',
    context: {
      name: templateParams.name,
      department: templateParams.department,
      jobRole: templateParams.jobRole,
      employeeId: templateParams.employeeId,
      resetUrl: templateParams.resetUrl,
      expiresInMinutes: templateParams.expiresInMinutes || 60
    }
  });
}

async function sendAnnouncementNotification(from, to, subject, templateParams) {
  return sendTemplatedMail({
    from,
    to,
    subject,
    template: 'notificationByEmail',
    context: {
      firstName: templateParams.firstName,
      title: templateParams.title
    }
  });
}

module.exports = {
  sendMail,
  paySlipSendMail,
  resetPasswordSendMail,
  sendAnnouncementNotification,
  journalProcessedSendMail,
  getDefaultFrom
};
