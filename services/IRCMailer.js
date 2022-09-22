const path = require('path')
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-handlebars');
const dotenv = require('dotenv');
dotenv.config();

// const transport = nodemailer.createTransport({
//   host: "smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "90d95c7dda4a44",
//     pass: "9554a813c869e7"
//   }
// });

// const transport = nodemailer.createTransport({
//     pool: true,
//     host: "**",
//     port: 465,
//     secure: true, // use SSL
//     auth: {
//         user: "**",
//         pass: "**"
//     },
//     tls: {
//         // do not fail on invalid certs
//         rejectUnauthorized: false,
//     },
// });

// const transport = nodemailer.createTransport({
//     host: "smtp.mailtrap.io",
//     port: 2525,
//     auth: {
//         user: "d00b66bb7e3062",
//         pass: "611de82767b826"
//     }
// });

const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
    }
});

const handlebarOptions = {
    viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve("email_views"),
        defaultLayout: false,
    },
    viewPath: path.resolve("email_views"),
    extName: ".handlebars",
};

transport.use(
    "compile",
    hbs(handlebarOptions)
);

// transport.use('compile', hbs({
//     viewEngine: {
//         extName: ".html",
//         partialsDir: path.resolve('/../email_views'),
//         defaultLayout: false,
//     },
//   viewPath: path.resolve('/../email_views'),
// }));


async function sendMail(from, to, subject, text){
  try{
    const message = {
      from: from,
      to: to,
      subject: subject,
      text: text
    }
    await transport.sendMail(message, function(err, res){
      if (err) {
        console.log(err)
      }
      else {
        console.log(res);
      }
    })
  }catch (e) {

  }

}


async function paySlipSendMail(from, to, subject, templateParams){
    try{

        const message = {
            from: from, // TODO: email sender
            to: to, // TODO: email receiver
            subject: subject,
            text: 'Wooohooo it works!!',
            template: 'payslipnotification',
            context: {
                monthYear: templateParams.monthYear,
                name: templateParams.name,
                department: templateParams.department,
                jobRole: templateParams.jobRole,
                employeeId: templateParams.employeeId,
                monthNumber: templateParams.monthNumber,
                yearNumber: templateParams.yearNumber,
                urlString: templateParams.urlString
            }
        };



   return   await transport.sendMail(message, function(err, res){
            if (err) {
                return err
            }
            else {
                return res
            }
        })
    }catch (e) {

    }

}

async function resetPasswordSendMail(from, to, subject, templateParams){
    try{

        const message = {
            from: from,
            to: to,
            subject: subject,
            text: 'Wooohooo it works!!',
            template: 'resetpassword',
            context: {
                name: templateParams.name,
                department: templateParams.department,
                jobRole: templateParams.jobRole,
                employeeId: templateParams.employeeId,
                password: templateParams.password
            }
        };



   return   await transport.sendMail(message, function(err, res){
            if (err) {
                return err
            }
            else {
                return res
            }
        })
    }catch (e) {

    }

}


async function sendAnnouncementNotification(from, to, subject, templateParams){
  try{

    const message = {
      from: from, // TODO: email sender
      to: to, // TODO: email receiver
      subject: subject,
      text: 'Wooohooo it works!!',
      template: 'notificationByEmail',
      context: {
        firstName: templateParams.firstName,
        title: templateParams.title,
      }
    };
    return   await transport.sendMail(message, function(err, res){
      if (err) {
        return err
      }
      else {
        return res
      }
    })
  }catch (e) {

  }

}
//sendMail('trendingnow@gmail.com', 'you@me.com', 'Subject goes here...', 'Here goes the content..')

module.exports = {
  sendMail,
    paySlipSendMail,
    resetPasswordSendMail,
  sendAnnouncementNotification
}
