const nodemailer = require("nodemailer");

class MailProvider {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: "smtp-mail.outlook.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.SENDER_EMAIL,
        pass: process.env.SENDER_PASSWORD,
      },
    });
  }

  sendMail = async (receiverEmail, subject, message) => {
    return await this.transporter.sendMail({
      from: process.env.SENDER_EMAIL,
      to: receiverEmail,
      subject: subject,
      text: message,
    });
  };
}

module.exports = new MailProvider();
