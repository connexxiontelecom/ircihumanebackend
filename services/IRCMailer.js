const nodemailer = require('nodemailer');
const hbs = require('nodemailer-handlebars');
const transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "90d95c7dda4a44",
    pass: "9554a813c869e7"
  }
});

transport.use('compile', hbs({
  viewEngine: 'express-handlebars',
  viewPath: '../email_views/'
}));


async function sendMail(from, to, subject, text){
  try{

   let mailOptions = {
      from: 'tabbnabbers@gmail.com', // TODO: email sender
      to: 'deltamavericks@gmail.com', // TODO: email receiver
      subject: 'Nodemailer - Test',
      text: 'Wooohooo it works!!',
      template: 'index',
      context: {
        name: 'Accime Esterling'
      } // send extra values to template
    };

    const message = {
      from: from,
      to: to,
      subject: subject,
      text: text
    }
    await transport.sendMail(message, function(err, res){
      if (err) {
        console.log(err)
      } else {
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
            template: 'index',
            context: {
                monthYear: templateParams.monthYear,
                name: templateParams.name,
                department: templateParams.department,
                jobRole: templateParams.jobRole,
                employeeId: templateParams.emp,
                monthNumber: templateParams.monthNumber,
                yearNumber: templateParams.yearNumber
            }
        };

        await transport.sendMail(message, function(err, res){
            if (err) {
                console.log(err)
            } else {
                console.log(res);
            }
        })
    }catch (e) {

    }

}

//sendMail('trendingnow@gmail.com', 'you@me.com', 'Subject goes here...', 'Here goes the content..')

module.exports = {
  sendMail,
}
