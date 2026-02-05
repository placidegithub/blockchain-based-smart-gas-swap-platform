import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import AfricasTalking from 'africastalking';

interface RedemptionNotificationRequest {
  voucherId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  companyName: string;
  sourceBranchName: string;
  destinationBranchName: string;
  destinationDistrict: string;
  cylinderType: string;
  newCylinderSerial: string;
  redeemedAt: string;
  txHash: string;
  serviceFee?: string;
  paymentStatus?: string;
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USERNAME || process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD || process.env.SMTP_PASS,
  },
});

const africastalking = AfricasTalking({
  apiKey: process.env.AT_API_KEY || '',
  username: process.env.AT_USERNAME || 'sandbox',
});

const sms = africastalking.SMS;

function formatRedemptionDate(redeemedAt: string): string {
  const date = new Date(redeemedAt);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateRedemptionEmailHtml(data: RedemptionNotificationRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Voucher Redeemed Successfully</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">✅ Voucher Redeemed Successfully!</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none;">
        <p style="font-size: 18px;">Dear <strong>${data.customerName}</strong>,</p>
        
        <p>Great news! Your gas cylinder voucher has been successfully redeemed. You have received your new gas cylinder.</p>
        
        <div style="background: white; border: 2px solid #10b981; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h2 style="color: #10b981; margin-top: 0; border-bottom: 2px solid #eee; padding-bottom: 10px;">Redemption Details</h2>
          
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
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Source Branch:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.sourceBranchName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Redeemed At:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.destinationBranchName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>District:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.destinationDistrict}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Cylinder Type:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${data.cylinderType}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>New Cylinder Serial:</strong></td>
              <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right; font-family: monospace;">${data.newCylinderSerial}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0;"><strong>Redemption Time:</strong></td>
              <td style="padding: 10px 0; text-align: right;">${formatRedemptionDate(data.redeemedAt)}</td>
            </tr>
            ${data.serviceFee && data.paymentStatus === 'Paid' ? `
            <tr>
              <td style="padding: 10px 0; border-top: 1px solid #eee;"><strong>Service Fee:</strong></td>
              <td style="padding: 10px 0; border-top: 1px solid #eee; text-align: right; color: #10b981;"><strong>${data.serviceFee}</strong> (Paid at source)</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="background: #d1fae5; border: 1px solid #10b981; border-radius: 5px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #065f46; margin: 0; font-size: 16px;">
            <strong>🎉 Thank you for using GasSwap!</strong>
          </p>
          <p style="color: #065f46; margin: 10px 0 0 0; font-size: 14px;">
            Your transaction has been recorded on the blockchain for full transparency.
          </p>
          <p style="color: #065f46; margin: 10px 0 0 0; font-size: 12px;">
            <em>No payment required at redemption - service fee was collected at deposit.</em>
          </p>
        </div>
        
        <div style="background: #f3f4f6; border-radius: 5px; padding: 15px; margin: 20px 0;">
          <p style="color: #6b7280; margin: 0; font-size: 12px;">
            <strong>Transaction Hash:</strong><br>
            <span style="font-family: monospace; word-break: break-all;">${data.txHash}</span>
          </p>
        </div>
        
        <p style="color: #666; font-size: 14px;">If you have any questions about this transaction, please contact our support team.</p>
      </div>
      
      <div style="background: #333; color: white; padding: 20px; text-align: center; border-radius: 0 0 10px 10px;">
        <p style="margin: 0; font-size: 14px;">GasSwap Platform - Secure Blockchain Vouchers</p>
      </div>
    </body>
    </html>
  `;
}

function generateRedemptionSmsMessage(data: RedemptionNotificationRequest): string {
  // Payment was already collected at source (voucher creation), no payment at redemption
  let paymentNote = '';
  if (data.serviceFee && data.paymentStatus === 'Paid') {
    paymentNote = ` (Service fee ${data.serviceFee} was paid at source).`;
  }
  return `GasSwap: Hi ${data.customerName}, voucher ${data.voucherId} successfully redeemed at ${data.destinationBranchName}, ${data.destinationDistrict}. You received: ${data.cylinderType}.${paymentNote} Thank you for using GasSwap!`;
}

async function sendEmail(data: RedemptionNotificationRequest): Promise<void> {
  const mailOptions: nodemailer.SendMailOptions = {
    from: `"GasSwap Platform" <${process.env.SMTP_FROM || process.env.SMTP_USERNAME}>`,
    to: data.customerEmail,
    subject: `✅ Voucher Redeemed - ${data.voucherId.slice(0, 8)}...`,
    html: generateRedemptionEmailHtml(data),
  };

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

async function sendSms(data: RedemptionNotificationRequest): Promise<void> {
  const message = generateRedemptionSmsMessage(data);
  const formattedPhone = formatPhoneNumber(data.customerPhone);
  
  console.log('=== REDEMPTION SMS NOTIFICATION ===');
  console.log(`To: ${formattedPhone}`);
  console.log(`Message: ${message}`);
  console.log('===================================');

  if (!process.env.AT_API_KEY || !process.env.AT_USERNAME) {
    console.log('Africa\'s Talking not configured, skipping SMS');
    return;
  }

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
  try {
    const body: RedemptionNotificationRequest = await request.json();

    const {
      voucherId,
      customerName,
      customerEmail,
      customerPhone,
      companyName,
      destinationBranchName,
      cylinderType,
      redeemedAt,
    } = body;

    if (!voucherId || !customerName || !companyName || !destinationBranchName || !cylinderType || !redeemedAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const results = {
      email: { sent: false, error: null as string | null },
      sms: { sent: false, error: null as string | null },
    };

    if (customerEmail) {
      try {
        await sendEmail(body);
        results.email.sent = true;
      } catch (error) {
        results.email.error = error instanceof Error ? error.message : 'Failed to send email';
        console.error('Email sending error:', error);
      }
    }

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

    return NextResponse.json({
      success: anySuccess,
      results,
      message: anySuccess ? 'Redemption notifications sent successfully' : 'Failed to send notifications',
    });
  } catch (error) {
    console.error('Redemption notification API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
