const nodemailer = require('nodemailer');
var transport = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "90d95c7dda4a44",
    pass: "9554a813c869e7"
  }
});


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
