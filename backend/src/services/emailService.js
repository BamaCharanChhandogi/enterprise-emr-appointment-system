const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = null;
    this.webhookUrl =
      process.env.GOOGLE_MAILER_WEBHOOK ||
      'https://script.google.com/macros/s/AKfycby9Tlp4TcmzPFq0VJbSN7z24l2xJBsTUzIaRlFWNj7rTq8HIwcJwhK17otshwoMy80/exec';
    this.initTransporter();
  }

  initTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: {
          user,
          pass
        }
      });
      console.log(`✉️ Email Service initialized (Google Apps Script Webhook + SMTP Fallback: ${user})`);
    } else {
      console.log(`✉️ Email Service initialized with Google Apps Script HTTPS Webhook`);
    }
  }

  /**
   * Unified dispatcher: Primary -> Google Apps Script HTTPS Webhook (Port 443)
   *                    Fallback -> Direct SMTP (nodemailer)
   */
  async sendMail({ to, subject, text, html }) {
    // 1. Primary: Google Apps Script HTTPS Webhook (Bypasses SMTP port blocks, 100% cloud & server compatible)
    if (this.webhookUrl) {
      try {
        const response = await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            subject,
            text: text || '',
            html: html || ''
          })
        });

        if (response.ok) {
          const resText = await response.text();
          console.log(`✉️ Email dispatched to ${to} via Google Apps Script HTTPS Webhook: ${resText}`);
          return { success: true, method: 'google_apps_script_webhook' };
        } else {
          console.warn(`Google webhook returned status ${response.status}, attempting SMTP fallback...`);
        }
      } catch (webhookErr) {
        console.warn('Google webhook dispatch failed, attempting SMTP fallback:', webhookErr?.message || webhookErr);
      }
    }

    // 2. Fallback: Direct SMTP
    if (this.transporter) {
      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM || `"NexusEMR Hospital System" <${process.env.EMAIL_USER}>`,
          to,
          subject,
          text: text || '',
          html: html || ''
        };
        const info = await this.transporter.sendMail(mailOptions);
        console.log(`✉️ Email dispatched to ${to} via SMTP (MessageId: ${info.messageId})`);
        return { success: true, method: 'smtp', messageId: info.messageId };
      } catch (smtpErr) {
        console.error(`❌ SMTP delivery failed for ${to}:`, smtpErr.message);
        return { success: false, error: smtpErr.message };
      }
    }

    console.log(`[SIMULATED EMAIL] To: ${to} | Subject: ${subject}`);
    return { success: true, simulated: true };
  }

  /**
   * Dispatch Staff Onboarding Invitation Email with Credentials
   */
  async sendStaffInviteEmail({ to, name, role, department, temporaryPassword, loginUrl }) {
    const clientUrl = loginUrl || process.env.CLIENT_URL || 'http://localhost:5173';
    const portalLoginLink = `${clientUrl}/login`;
    const subject = `🏥 NexusEMR Staff Invitation: Your Clinical Credentials for ${name}`;
    const text = `Welcome to NexusEMR Medical Team, ${name}!

Your staff account has been provisioned in the hospital clinical management network.
Role: ${role}
Department: ${department || 'General Staff'}

Login Portal: ${portalLoginLink}
Username: ${to}
Temporary Password: ${temporaryPassword}

Please sign in and update your password on first login.`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #0f172a; }
          .container { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: #1e40af; padding: 28px 32px; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
          .header p { margin: 4px 0 0 0; font-size: 12px; color: #bfdbfe; text-transform: uppercase; letter-spacing: 1px; }
          .content { padding: 32px; }
          .badge { display: inline-block; padding: 4px 12px; background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-bottom: 16px; }
          .credentials-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 14px; padding: 20px; margin: 20px 0; }
          .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
          .cred-label { color: #64748b; font-weight: 600; }
          .cred-val { color: #0f172a; font-weight: 700; font-family: monospace; }
          .pwd-highlight { background: #ecfdf5; color: #047857; padding: 2px 8px; border-radius: 6px; border: 1px solid #a7f3d0; }
          .btn { display: inline-block; width: 100%; text-align: center; background: #1e40af; color: #ffffff !important; padding: 14px 0; border-radius: 12px; font-size: 14px; font-weight: 700; text-decoration: none; margin-top: 16px; }
          .footer { padding: 20px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; line-height: 1.5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NexusEMR Clinical Healthcare</h1>
            <p>Authorized Personnel Onboarding & Security Credentials</p>
          </div>
          
          <div class="content">
            <span class="badge">${role}</span>
            <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a;">Welcome to the Medical Team, ${name}!</h2>
            <p style="font-size: 13px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
              Your staff account has been provisioned in the hospital clinical management network with assigned department: <b>${department || 'General Staff'}</b>.
            </p>

            <div class="credentials-box">
              <div class="cred-row">
                <span class="cred-label">Login Portal:</span>
                <span class="cred-val">${portalLoginLink}</span>
              </div>
              <div class="cred-row">
                <span class="cred-label">Username / Email:</span>
                <span class="cred-val">${to}</span>
              </div>
              <div class="cred-row" style="margin-bottom: 0;">
                <span class="cred-label">Temporary Password:</span>
                <span class="cred-val pwd-highlight">${temporaryPassword}</span>
              </div>
            </div>

            <p style="font-size: 12px; color: #64748b; margin: 0 0 16px 0;">
              🔒 <b>Security Policy</b>: This is a temporary access credential. You are required to sign in and update your security credentials upon initial login.
            </p>

            <a href="${portalLoginLink}" class="btn">Sign In to Hospital EMR Portal →</a>
          </div>

          <div class="footer">
            NexusEMR Enterprise Hospital System • Clinical Governance & Compliance<br>
            If you did not expect this invitation, please contact your hospital administrative desk immediately.
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendMail({ to, subject, text, html });
  }

  /**
   * Dispatch Patient Appointment Confirmation Slip Email
   */
  async sendAppointmentConfirmationEmail({ to, patientName, doctorName, department, date, slotStartTime, slotEndTime, appointmentNumber }) {
    if (!to) return { success: false };

    const subject = `🏥 Appointment Confirmed: Token ${appointmentNumber} on ${date}`;
    const text = `Dear ${patientName},

Your outpatient appointment has been scheduled successfully:
- Appointment Token: ${appointmentNumber}
- Doctor: Dr. ${doctorName} (${department})
- Date & Time: ${date} (${slotStartTime} - ${slotEndTime})

Please arrive at the front desk 10 minutes prior to your scheduled time.`;

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: sans-serif; background: #f8fafc; padding: 24px;">
        <div style="max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; padding: 28px;">
          <h2 style="color: #1e40af; margin-top: 0;">NexusEMR Appointment Confirmation</h2>
          <p>Dear ${patientName},</p>
          <p>Your outpatient appointment has been scheduled successfully:</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 10px; margin: 16px 0;">
            <p><strong>Appointment Token:</strong> ${appointmentNumber}</p>
            <p><strong>Doctor:</strong> ${doctorName} (${department})</p>
            <p><strong>Date & Time:</strong> ${date} (${slotStartTime} - ${slotEndTime})</p>
          </div>
          <p style="font-size: 12px; color: #64748b;">Please arrive at the front desk 10 minutes prior to your scheduled time.</p>
        </div>
      </body>
      </html>
    `;

    return await this.sendMail({ to, subject, text, html });
  }
}

module.exports = new EmailService();
