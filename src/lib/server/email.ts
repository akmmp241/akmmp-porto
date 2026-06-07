import { env } from '$env/dynamic/private';
import nodemailer from 'nodemailer';

const smtpHost = env.SMTP_HOST;
const smtpPort = env.SMTP_PORT ? parseInt(env.SMTP_PORT, 10) : 587;
const smtpUser = env.SMTP_USER;
const smtpPass = env.SMTP_PASS;
const adminEmail = env.ADMIN_EMAIL || 'admin@localhost';

// Initialize Transporter if all required config is present
const transporter = (smtpHost && smtpUser && smtpPass)
	? nodemailer.createTransport({
			host: smtpHost,
			port: smtpPort,
			secure: smtpPort === 465, // true for 465, false for other ports
			auth: {
				user: smtpUser,
				pass: smtpPass
			}
		})
	: null;

interface ContactEmailOptions {
	name: string;
	email: string;
	subject?: string;
	message: string;
}

/**
 * Sends a notification email to the admin for a new contact form submission.
 */
export async function sendContactNotification({
	name,
	email,
	subject,
	message
}: ContactEmailOptions): Promise<boolean> {
	const emailSubject = `New Contact Form Submission: ${subject || 'No Subject'}`;
	const textContent = `
Name: ${name}
Email: ${email}
Subject: ${subject || 'N/A'}

Message:
${message}
	`;

	const htmlContent = `
		<div style="font-family: sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; padding: 20px; border-radius: 8px;">
			<h2 style="border-bottom: 2px solid #5a0fc8; padding-bottom: 10px; color: #5a0fc8; margin-top: 0;">New Contact Message</h2>
			<table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
				<tr>
					<td style="padding: 6px 0; font-weight: bold; width: 100px;">From:</td>
					<td style="padding: 6px 0;">${name} (&lt;${email}&gt;)</td>
				</tr>
				<tr>
					<td style="padding: 6px 0; font-weight: bold;">Subject:</td>
					<td style="padding: 6px 0;">${subject || 'No Subject'}</td>
				</tr>
			</table>
			<div style="background: #f9f9f9; padding: 15px; border-radius: 4px; border-left: 4px solid #5a0fc8; white-space: pre-wrap; margin-top: 15px;">${message}</div>
		</div>
	`;

	if (!transporter) {
		console.warn('⚠️ [SMTP Email Skipped] SMTP configuration (SMTP_HOST, SMTP_USER, SMTP_PASS) is missing in .env.');
		console.log('--- Email Details ---');
		console.log(`To: ${adminEmail}`);
		console.log(`Reply-To: ${email}`);
		console.log(`Subject: ${emailSubject}`);
		console.log(`Body: ${textContent}`);
		console.log('----------------------');
		return false;
	}

	try {
		await transporter.sendMail({
			from: `"Portfolio Contact" <${smtpUser}>`, // Must be smtpUser to avoid authorization issues with Gmail SMTP
			to: adminEmail,
			replyTo: email,
			subject: emailSubject,
			text: textContent,
			html: htmlContent
		});

		return true;
	} catch (e) {
		console.error('SMTP email error:', e);
		return false;
	}
}
