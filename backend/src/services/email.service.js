const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send verification email
const sendVerificationEmail = async (email, verificationLink) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification - Higher Education System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Email Verification</h2>
          <p>Thank you for registering with our Higher Education Management System.</p>
          <p>Please click the link below to verify your email address:</p>
          <a href="${verificationLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>If you didn't create this account, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
};

// Send admission notification
const sendAdmissionNotification = async (email, studentName, courseName, status) => {
  const statusText = status === 'admitted' ? 'Congratulations! You have been admitted' : 
                     status === 'waitlisted' ? 'You have been placed on the waiting list' :
                     'Unfortunately, your application was not successful';
  
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Admission Update - ${courseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Admission Status Update</h2>
        <p>Dear ${studentName},</p>
        <p>${statusText} for <strong>${courseName}</strong>.</p>
        <p>Please log in to your account for more details.</p>
        <p>Best regards,<br>Higher Education Management System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send job notification
const sendJobNotification = async (email, studentName, jobTitle, companyName) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `New Job Opportunity - ${jobTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Job Opportunity</h2>
        <p>Dear ${studentName},</p>
        <p>A new job opportunity matching your profile is available:</p>
        <p><strong>${jobTitle}</strong> at <strong>${companyName}</strong></p>
        <p>Log in to your account to view details and apply.</p>
        <p>Best regards,<br>Higher Education Management System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

// Send company approval notification
const sendCompanyApprovalEmail = async (email, companyName, approved) => {
  const status = approved ? 'approved' : 'rejected';
  const message = approved ? 'Your company account has been approved. You can now post job opportunities.' :
                  'Your company registration has been reviewed and unfortunately not approved at this time.';

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `Company Registration ${status.charAt(0).toUpperCase() + status.slice(1)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Company Registration Update</h2>
        <p>Dear ${companyName},</p>
        <p>${message}</p>
        <p>Best regards,<br>Higher Education Management System</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

module.exports = {
  sendVerificationEmail,
  sendAdmissionNotification,
  sendJobNotification,
  sendCompanyApprovalEmail
};