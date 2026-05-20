import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

// Generate simulated or actual SMTP transporter
const createTransporter = () => {
  // If SMTP environment variables are defined, use them
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback / Development: Mock transporter
  return {
    sendMail: async (options) => {
      console.log('---------------- MOCK EMAIL SENT ----------------');
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      
      // Extract verification link from HTML content for easy console clicking
      const linkMatch = options.html.match(/href="([^"]+)"/);
      if (linkMatch && linkMatch[1]) {
        console.log(`Verification Link: ${linkMatch[1]}`);
      }
      
      console.log('--------------------------------------------------');
      
      // Write to a temporary HTML file in backend directory for testing
      try {
        const dir = path.join(process.cwd(), 'temp_emails');
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir);
        }
        const filepath = path.join(dir, `verify-${Date.now()}.html`);
        fs.writeFileSync(filepath, options.html);
        console.log(`Email saved locally to: ${filepath}`);
      } catch (err) {
        console.error('Failed to save mock email to file:', err.message);
      }
      
      return { messageId: 'mock-id-' + Date.now() };
    }
  };
};

export const sendVerificationEmail = async (email, fullName, token) => {
  const transporter = createTransporter();
  
  // Link to the backend verification endpoint
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:5001';
  const verificationLink = `${backendUrl}/api/auth/verify-email?token=${token}`;
  
  const mailOptions = {
    from: '"Steria Finance" <no-reply@steria.app>',
    to: email,
    subject: 'Welcome to Steria! Activate your account ✨',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Activate Your Steria Account</title>
        <style>
          body {
            background-color: #070a13;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin: 0;
            padding: 0;
            -webkit-font-smoothing: antialiased;
            color: #d1d5db;
          }
          .wrapper {
            background-color: #070a13;
            width: 100%;
            table-layout: fixed;
            padding: 40px 0;
          }
          .container {
            max-width: 560px;
            margin: 0 auto;
            background-color: #0d1324;
            border-radius: 20px;
            border: 1px solid rgba(124, 58, 237, 0.15);
            overflow: hidden;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          }
          .header {
            padding: 30px 40px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          }
          .logo {
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.5px;
            color: #ffffff;
            text-decoration: none;
            display: inline-block;
          }
          .logo-dot {
            color: #06b6d4;
          }
          .content {
            padding: 40px 40px 30px;
          }
          h1 {
            color: #ffffff;
            font-size: 22px;
            font-weight: 700;
            margin-top: 0;
            margin-bottom: 16px;
            line-height: 1.3;
            text-align: center;
          }
          p {
            font-size: 15px;
            line-height: 1.6;
            margin-bottom: 24px;
            color: #9ca3af;
          }
          .btn-container {
            text-align: center;
            margin: 35px 0;
          }
          .btn {
            background: linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%);
            color: #ffffff !important;
            display: inline-block;
            padding: 14px 32px;
            font-size: 15px;
            font-weight: 600;
            text-decoration: none;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
            transition: all 0.2s ease;
          }
          .footer {
            padding: 30px 40px;
            background-color: #090e1a;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            text-align: center;
          }
          .footer-text {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 8px;
          }
          .tagline {
            font-size: 11px;
            font-weight: 700;
            color: #a78bfa;
            letter-spacing: 1px;
            text-transform: uppercase;
          }
          .expiry {
            font-size: 12px;
            color: #6b7280;
            text-align: center;
            margin-top: 15px;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="container">
            <div class="header">
              <a href="#" class="logo">Steria<span class="logo-dot">.</span></a>
            </div>
            
            <div class="content">
              <h1>Verify your email</h1>
              <p>Hi ${fullName},</p>
              <p>Welcome to Steria! We're thrilled to have you join our premium personal financial ecosystem. To get started and activate your account, please verify your email address by clicking the button below.</p>
              
              <div class="btn-container">
                <a href="${verificationLink}" class="btn" target="_blank">Activate Account</a>
              </div>
              
              <p class="expiry">This link will expire in 24 hours. If you did not create a Steria account, please ignore this email.</p>
            </div>
            
            <div class="footer">
              <div class="footer-text">&copy; ${new Date().getFullYear()} Steria App. All rights reserved.</div>
              <div class="tagline">Track. Budget. Grow.</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `,
  };

  return await transporter.sendMail(mailOptions);
};
