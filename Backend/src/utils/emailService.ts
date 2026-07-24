import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const isEmailConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER);

export async function sendLeaveApplicationEmail(approverEmail: string, applicantName: string, leaveType: string, fromDate: Date, toDate: Date) {
  if (!isEmailConfigured) {
    console.log(`[Email Stub] Leave application email intended for ${approverEmail} (Applicant: ${applicantName}, Type: ${leaveType})`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || '"SkyTech HR" <hr@skytech.com>',
      to: approverEmail,
      subject: `Leave Application Approval Required: ${applicantName}`,
      text: `Employee ${applicantName} has applied for ${leaveType} leave from ${fromDate.toDateString()} to ${toDate.toDateString()}.\nPlease review in the Employee Hub.`,
    });
  } catch (err) {
    console.error('Failed to send leave application email:', err);
  }
}

export async function sendLeaveStatusEmail(applicantEmail: string, applicantName: string, status: string, leaveType: string) {
  if (!isEmailConfigured) {
    console.log(`[Email Stub] Leave status email intended for ${applicantEmail} (Status: ${status}, Type: ${leaveType})`);
    return;
  }

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL || '"SkyTech HR" <hr@skytech.com>',
      to: applicantEmail,
      subject: `Leave Application Status: ${status}`,
      text: `Hello ${applicantName},\n\nYour application for ${leaveType} leave has been ${status.toLowerCase()}.\n\nRegards,\nSkyTech HR`,
    });
  } catch (err) {
    console.error('Failed to send leave status email:', err);
  }
}
