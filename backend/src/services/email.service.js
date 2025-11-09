// backend/src/services/email.service.js
const sgMail = require('@sendgrid/mail');
require('dotenv').config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

class EmailService {
  /**
   * Send verification email
   */
  async sendVerificationEmail(email, verificationLink, userName) {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject: 'Verify Your Email - CGEIP Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CGEIP!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>
              <p>Thank you for registering with CGEIP (Centralized Gateway for Education and Industry Placement).</p>
              <p>Please verify your email address by clicking the button below:</p>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #3b82f6;">${verificationLink}</p>
              <p><strong>This link will expire in 24 hours.</strong></p>
              <p>If you didn't create an account, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CGEIP Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${userName || 'there'},
        
        Thank you for registering with CGEIP!
        
        Please verify your email address by clicking the link below:
        ${verificationLink}
        
        This link will expire in 24 hours.
        
        If you didn't create an account, please ignore this email.
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Verification email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending verification email:', error);
      if (error.response) {
        console.error('SendGrid error:', error.response.body);
      }
      return { success: false, error: error.message };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, resetLink, userName) {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject: 'Reset Your Password - CGEIP Platform',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi ${userName || 'there'},</p>
              <p>We received a request to reset your password for your CGEIP account.</p>
              <p>Click the button below to reset your password:</p>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #ef4444;">${resetLink}</p>
              <p><strong>This link will expire in 1 hour.</strong></p>
              <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CGEIP Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Hi ${userName || 'there'},
        
        We received a request to reset your password for your CGEIP account.
        
        Click the link below to reset your password:
        ${resetLink}
        
        This link will expire in 1 hour.
        
        If you didn't request a password reset, please ignore this email.
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Password reset email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending password reset email:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send welcome email after verification
   */
  async sendWelcomeEmail(email, userName, userRole) {
    const msg = {
      to: email,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL,
        name: process.env.SENDGRID_FROM_NAME
      },
      subject: 'Welcome to CGEIP Platform!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to CGEIP!</h1>
            </div>
            <div class="content">
              <p>Hi ${userName},</p>
              <p>Your email has been verified successfully! Welcome to the CGEIP Platform.</p>
              <p>As a <strong>${userRole}</strong>, you now have access to:</p>
              <ul>
                ${this.getRoleFeatures(userRole)}
              </ul>
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/login" class="button">Go to Dashboard</a>
              </div>
              <p>If you have any questions, feel free to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} CGEIP Platform. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      await sgMail.send(msg);
      console.log(`✅ Welcome email sent to ${email}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error sending welcome email:', error);
      return { success: false, error: error.message };
    }
  }

  getRoleFeatures(role) {
    const features = {
      student: `
        <li>Apply to multiple educational institutions</li>
        <li>Track your application status</li>
        <li>Browse job opportunities</li>
        <li>Upload academic documents</li>
      `,
      institute: `
        <li>Manage course offerings</li>
        <li>Review student applications</li>
        <li>Publish admission results</li>
        <li>Track enrolled students</li>
      `,
      company: `
        <li>Post job opportunities</li>
        <li>View qualified candidates</li>
        <li>Manage applications</li>
        <li>Access student profiles</li>
      `,
      admin: `
        <li>Manage all institutions and companies</li>
        <li>Oversee system operations</li>
        <li>Generate reports</li>
        <li>Monitor platform activity</li>
      `
    };
    return features[role] || '<li>Access your personalized dashboard</li>';
  }
}

module.exports = new EmailService();