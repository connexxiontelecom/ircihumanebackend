const path = require('path')
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-handlebars');

// const transport = nodemailer.createTransport({
//   host: "smtp.mailtrap.io",
//   port: 2525,
//   auth: {
//     user: "90d95c7dda4a44",
//     pass: "9554a813c869e7"
//   }
// });

const transport = nodemailer.createTransport({
    pool: true,
    host: "connexxiongroup.com",
    port: 465,
    secure: true, // use SSL
    auth: {
        user: "oki-peter@connexxiongroup.com",
        pass: "connect@okipeter"
    },
    tls: {
        // do not fail on invalid certs
        rejectUnauthorized: false,
    },
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
                yearNumber: templateParams.yearNumber
            }
        };



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

//sendMail('trendingnow@gmail.com', 'you@me.com', 'Subject goes here...', 'Here goes the content..')

module.exports = {
  sendMail,
    paySlipSendMail
}
