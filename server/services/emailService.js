import nodemailer from 'nodemailer';

class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this.initializeTransporter();
  }

  initializeTransporter() {
    try {
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

      // Validate SMTP configuration
      if (!smtpConfig.auth.user || !smtpConfig.auth.pass) {
        console.warn('⚠️  Email service: SMTP credentials not configured. Email functionality disabled.');
        this.initialized = false;
        return;
      }

      this.transporter = nodemailer.createTransport(smtpConfig);
      this.initialized = true;
      console.log('✓ Email service initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize email service:', error.message);
      this.initialized = false;
    }
  }

  composeEmail(customerMessage, trackingNumber = null) {
    const subject = 'Shipment Delay Notification';
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #3d4f63;
              background-color: #f5f7fa;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 12px;
              box-shadow: 0 4px 16px rgba(20, 93, 190, 0.08);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #145DBE 0%, #0f3a7d 100%);
              color: white;
              padding: 30px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 1.8rem;
              font-weight: 700;
              letter-spacing: -0.3px;
            }
            .content {
              padding: 32px 24px;
            }
            .message-section {
              background: linear-gradient(135deg, #f8f9fa 0%, #f0f4ff 100%);
              border-left: 3px solid #145DBE;
              border-radius: 6px;
              padding: 20px;
              margin-bottom: 24px;
            }
            .message-text {
              margin: 0;
              color: #3d4f63;
              line-height: 1.6;
              font-size: 0.95rem;
            }
            .tracking-info {
              background: #f5f7fa;
              border-radius: 6px;
              padding: 16px;
              margin-bottom: 24px;
              border: 1px solid rgba(20, 93, 190, 0.1);
            }
            .tracking-label {
              font-size: 0.85rem;
              color: #5a6b7f;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 6px;
            }
            .tracking-value {
              font-size: 1.1rem;
              color: #145DBE;
              font-weight: 700;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background: #f5f7fa;
              padding: 20px 24px;
              text-align: center;
              border-top: 1px solid rgba(20, 93, 190, 0.08);
              font-size: 0.85rem;
              color: #5a6b7f;
            }
            .footer p {
              margin: 0;
              line-height: 1.5;
            }
            strong {
              color: #145DBE;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📦 Shipment Delay Notification</h1>
            </div>
            <div class="content">
              ${trackingNumber ? `
                <div class="tracking-info">
                  <div class="tracking-label">Tracking Number</div>
                  <div class="tracking-value">${trackingNumber}</div>
                </div>
              ` : ''}
              <div class="message-section">
                <p class="message-text">${customerMessage.replace(/\n/g, '<br>')}</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated notification from our Shipment Delay Analytics System.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const plainTextContent = `
Shipment Delay Notification
${'='.repeat(50)}

${trackingNumber ? `Tracking Number: ${trackingNumber}\n` : ''}

${customerMessage}

${'='.repeat(50)}
This is an automated notification from our Shipment Delay Analytics System.
If you have any questions, please contact our support team.
    `.trim();

    return {
      subject,
      html: htmlContent,
      text: plainTextContent,
    };
  }

  async sendEmail(recipientEmail, customerMessage, trackingNumber = null) {
    if (!this.initialized) {
      throw new Error('Email service is not initialized. Check SMTP configuration.');
    }

    try {
      const emailContent = this.composeEmail(customerMessage, trackingNumber);

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('✓ Email sent successfully:', info.messageId);
      return {
        success: true,
        messageId: info.messageId,
        message: 'Email sent successfully',
      };
    } catch (error) {
      console.error('❌ Error sending email:', error.message);
      throw error;
    }
  }
}

export default new EmailService();
