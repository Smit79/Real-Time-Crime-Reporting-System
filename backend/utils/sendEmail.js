const nodemailer = require('nodemailer');
const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  EMAIL_FROM,
} = require('../config/env');

const sendEmail = async ({ to, subject, html, text }) => {
  // Log config in development to catch missing values
  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error('Email credentials missing in .env file');
  }

  const transporter = nodemailer.createTransport({
    host:   EMAIL_HOST   || 'smtp.gmail.com',
    port:   Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false,  // fix self-signed cert errors
    },
  });

  // Verify transporter connection
  await transporter.verify();

  const mailOptions = {
    from:    EMAIL_FROM || EMAIL_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, ''),
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`Email sent to ${to}: ${info.messageId}`);
  return info;
};

module.exports = sendEmail;