import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import AfricasTalking from 'africastalking';

interface NotificationRequest {
  voucherId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  branchName: string;
  cylinderType: string;
  expiresAt: string;
  qrCodeDataUrl?: string;
  serviceFee?: string;
  paymentStatus?: string;
}

function isConfiguredSecret(value?: string): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return !(
    normalized.startsWith('your_') ||
    normalized.includes('example') ||
    normalized.includes('placeholder')
  );
}

const smtpUser = process.env.SMTP_USERNAME || process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASSWORD || process.env.SMTP_PASS;
const hasSmtpConfig = isConfiguredSecret(smtpUser) && isConfiguredSecret(smtpPass);
const transporter = hasSmtpConfig
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })
  : null;

const hasAfricaTalkingConfig = isConfiguredSecret(process.env.AT_API_KEY) && isConfiguredSecret(process.env.AT_USERNAME);
const africastalking = hasAfricaTalkingConfig
  ? AfricasTalking({
      apiKey: process.env.AT_API_KEY as string,
      username: process.env.AT_USERNAME as string,
    })
  : null;

const sms = africastalking?.SMS ?? null;

function formatExpiryDate(expiresAt: string): string {
  const date = new Date(expiresAt);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateEmailHtml(data: NotificationRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Your Gas Cylinder Voucher</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">🎉 Your Voucher is Ready!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <p style="font-size: 18px;">Dear <strong>${data.customerName}</strong>,</p>
        
        <p>Your gas cylinder voucher has been successfully created and is ready for redemption. Below are your voucher details:</p>
        
        <div style="background: white; border: 2px solid #667eea; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #667eea; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Voucher Details</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Voucher ID:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${data.voucherId}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Company:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.companyName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Branch:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.branchName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Cylinder Type:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.cylinderType}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;"><strong>Expires:</strong></td>
              <td style="padding: 10px 0; text-align: right; color: #e74c3c;">${formatExpiryDate(data.expiresAt)}</td>
            </tr>
            ${data.serviceFee ? `
            <tr>
              <td style="padding: 10px 0; border-top: 2px solid #667eea;"><strong>💰 Service Fee:</strong></td>
              <td style="padding: 10px 0; border-top: 2px solid #667eea; text-align: right; color: #667eea; font-size: 18px;"><strong>${data.serviceFee}</strong></td>
            </tr>
            <tr>
              <td colspan="2" style="padding: 5px 0; text-align: center; color: ${data.paymentStatus === 'Paid' ? '#10b981' : '#f59e0b'};">
                <span style="background: ${data.paymentStatus === 'Paid' ? '#d1fae5' : '#fef3c7'}; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${data.paymentStatus === 'Paid' ? '✅ PAID' : '⏳ Payment ' + (data.paymentStatus || 'Pending')}
                </span>
              </td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <h3 style="color: #667eea;">Your QR Code</h3>
          <p style="color: #666; font-size: 14px;">Present this QR code at the branch for redemption</p>
          <img src="${data.qrCodeDataUrl}" alt="Voucher QR Code" style="max-width: 250px; border: 3px solid #667eea; border-radius: 10px; padding: 10px; background: white;">
        </div>
        
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <h4 style="color: #856404; margin-top: 0;">📋 Redemption Instructions</h4>
          <ol style="color: #856404; margin-bottom: 0; padding-left: 20px;">
            <li>Visit <strong>${data.branchName}</strong> of <strong>${data.companyName}</strong></li>
            <li>Show this QR code to the staff at the counter</li>
            <li>The staff will scan and verify your voucher</li>
            <li>Collect your <strong>${data.cylinderType}</strong> gas cylinder</li>
          </ol>
        </div>
        
        <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="color: #721c24; margin: 0;"><strong>⚠️ Important:</strong> This voucher expires on <strong>${formatExpiryDate(data.expiresAt)}</strong>. Please redeem before the expiry date.</p>
        </div>
        
        <p style="color: #666; font-size: 14px;">If you have any questions, please contact our support team.</p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="margin: 0; font-size: 14px;">Gas Swap Platform - Secure Blockchain Vouchers</p>
      </div>
    </body>
    </html>
  `;
}

function generateSmsMessage(data: NotificationRequest): string {
  let paymentInfo = '';
  if (data.serviceFee) {
    const status = data.paymentStatus || 'Pending';
    paymentInfo = ` SERVICE FEE: ${data.serviceFee} (${status}).`;
  }
  return `GasSwap: Hi ${data.customerName}, voucher ${data.voucherId} for ${data.cylinderType} at ${data.companyName} created.${paymentInfo} Show QR at any branch to redeem. Valid 30 days.`;
}

async function sendEmail(data: NotificationRequest): Promise<void> {
  if (!transporter) {
    console.log('SMTP not configured, skipping email notification');
    return;
  }

  const mailOptions: nodemailer.SendMailOptions = {
    from: `"Gas Cylinder Swap Platform" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
    to: data.customerEmail,
    subject: `Your Gas Cylinder Voucher - ${data.voucherId.slice(0, 8)}...`,
    html: generateEmailHtml(data),
  };

  if (data.qrCodeDataUrl && data.qrCodeDataUrl.startsWith('data:image')) {
    const base64Data = data.qrCodeDataUrl.split(',')[1];
    mailOptions.attachments = [
      {
        filename: 'voucher-qrcode.png',
        content: base64Data,
        encoding: 'base64',
        cid: 'qrcode@gasswap',
      },
    ];
    mailOptions.html = (mailOptions.html as string).replace(
      data.qrCodeDataUrl,
      'cid:qrcode@gasswap'
    );
  }

  await transporter.sendMail(mailOptions);
}

function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\s/g, '');
  if (cleaned.startsWith('+250')) {
    return cleaned;
  }
  if (cleaned.startsWith('0')) {
    return '+250' + cleaned.substring(1);
  }
  if (cleaned.startsWith('250')) {
    return '+' + cleaned;
  }
  return '+250' + cleaned;
}

async function sendSms(data: NotificationRequest): Promise<void> {
  if (!sms) {
    console.log('Africa\'s Talking not configured, skipping SMS notification');
    return;
  }

  const message = generateSmsMessage(data);
  const formattedPhone = formatPhoneNumber(data.customerPhone);
  
  console.log('=== SMS NOTIFICATION ===');
  console.log(`To: ${formattedPhone}`);
  console.log(`Message: ${message}`);
  console.log('========================');

  try {
    const result = await sms.send({
      to: [formattedPhone],
      message: message,
      from: process.env.AT_SENDER_ID,
    });
    console.log('SMS sent successfully:', result);
  } catch (error) {
    console.error('Africa\'s Talking SMS error:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  console.log('=== VOUCHER CREATION NOTIFICATION API CALLED ===');
  
  try {
    const body: NotificationRequest = await request.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    const {
      voucherId,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      branchName,
      cylinderType,
      expiresAt,
    } = body;

    if (!voucherId || !customerName || !companyName || !branchName || !cylinderType || !expiresAt) {
      console.log('Missing required fields:', { voucherId, customerName, companyName, branchName, cylinderType, expiresAt });
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const results = {
      email: { sent: false, error: null as string | null },
      sms: { sent: false, error: null as string | null },
    };

    // Send email notification
    if (customerEmail) {
      try {
        await sendEmail(body);
        results.email.sent = true;
      } catch (error) {
        results.email.error = error instanceof Error ? error.message : 'Failed to send email';
        console.error('Email sending error:', error);
      }
    }

    // Send SMS notification
    if (customerPhone) {
      try {
        await sendSms(body);
        results.sms.sent = true;
      } catch (error) {
        results.sms.error = error instanceof Error ? error.message : 'Failed to send SMS';
        console.error('SMS sending error:', error);
      }
    }

    const anySuccess = results.email.sent || results.sms.sent;
    const notificationWarnings: string[] = [];

    if (customerEmail && !results.email.sent) {
      notificationWarnings.push(results.email.error || 'Email notification was not sent');
    }
    if (customerPhone && !results.sms.sent) {
      notificationWarnings.push(results.sms.error || 'SMS notification was not sent');
    }

    return NextResponse.json({
      success: anySuccess,
      results,
      message:
        notificationWarnings.length > 0
          ? anySuccess
            ? `Voucher created successfully. Notification warnings: ${notificationWarnings.join(' | ')}`
            : `Voucher created, but notifications were not sent: ${notificationWarnings.join(' | ')}`
          : 'Notifications sent successfully',
    });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
