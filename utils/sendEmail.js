import nodemailer from 'nodemailer';

const sendEmail = async function({email, subject, message}){

    const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // Use `true` for port 465, `false` for all other ports
        auth: {
          user: process.env.SMTP_USERNAME,
          pass: process.env.SMTP_PASSWORD,
        },
      });

    // async..await is not allowed in global scope, must use a wrapper
    await transporter.sendMail({
        from: process.env.FROM_EMAIL, // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        html: message, // html body
    });
}

export default sendEmail;