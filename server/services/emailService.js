import Brevo from '@getbrevo/brevo';

// Initialize Brevo API client lazily
let apiInstance = null;

function getBrevoClient() {
    if (!apiInstance) {
        const apiKey = process.env.BREVO_API_KEY;
        if (!apiKey) {
            console.warn('⚠️ BREVO_API_KEY not configured - emails will not be sent');
            return null;
        }

        apiInstance = new Brevo.TransactionalEmailsApi();
        apiInstance.setApiKey(Brevo.TransactionalEmailsApiApiKeys.apiKey, apiKey);
        console.log('✅ Brevo email client initialized');
    }
    return apiInstance;
}

/**
 * Send an email using Brevo
 */
export async function sendEmail({ to, subject, html }) {
    try {
        const client = getBrevoClient();
        if (!client) {
            console.warn('📧 Email not sent (Brevo not configured):', to);
            return { success: false, error: 'Email service not configured' };
        }



        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.subject = subject;
        sendSmtpEmail.htmlContent = html;
        sendSmtpEmail.sender = {
            name: 'Club Connect',
            email: process.env.EMAIL_USER || 'noreply@clubconnect.com'
        };
        sendSmtpEmail.to = [{ email: to }];

        const result = await client.sendTransacEmail(sendSmtpEmail);

        return { success: true, messageId: result?.body?.messageId };
    } catch (err) {
        console.error('❌ Email send failed:', err.message || err);
        return { success: false, error: err.message || 'Unknown error' };
    }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(user, resetUrl) {
    return sendEmail({
        to: user.email,
        subject: 'Password Reset - Club Connect',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #002147; padding: 20px; text-align: center;">
                    <h1 style="color: #DAA520; margin: 0;">Club Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #002147;">Password Reset Request</h2>
                    <p>Hello ${user.name},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background: #DAA520; color: #002147; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this, please ignore this email.</p>
                </div>
                <div style="background: #002147; padding: 15px; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Club Connect - Walchand College of Engineering</p>
                </div>
            </div>
        `,
    });
}

/**
 * Send club invitation email
 */
export async function sendClubInvitationEmail({ name, email, role, clubName, signUpUrl }) {
    return sendEmail({
        to: email,
        subject: `You've been added to ${clubName} - Create Your Account`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #002147; padding: 20px; text-align: center;">
                    <h1 style="color: #DAA520; margin: 0;">Club Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #002147;">Welcome to ${clubName}!</h2>
                    <p>Hello ${name},</p>
                    <p>You've been added as a <strong>${role}</strong> to ${clubName} on Club Connect!</p>
                    <p>To get started, please create your account:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${signUpUrl}" style="background: #DAA520; color: #002147; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                            Create Account
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Your registered email: ${email}</p>
                    <p style="color: #666; font-size: 14px;">Club: ${clubName}</p>
                    <p style="color: #666; font-size: 14px;">Role: ${role}</p>
                </div>
                <div style="background: #002147; padding: 15px; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Club Connect - Walchand College of Engineering</p>
                </div>
            </div>
        `,
    });
}


/**
 * Send OTP for registration
 */
export async function sendOtpEmail(email, otp) {
    return sendEmail({
        to: email,
        subject: 'Verify Your Email - Club Connect',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: #002147; padding: 20px; text-align: center;">
                    <h1 style="color: #DAA520; margin: 0;">Club Connect</h1>
                </div>
                <div style="padding: 30px; background: #f9f9f9;">
                    <h2 style="color: #002147;">Verify Your Email</h2>
                    <p>Hello,</p>
                    <p>Use the following One-Time Password (OTP) to complete your registration:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <span style="font-size: 32px; letter-spacing: 5px; font-weight: bold; color: #002147; background: #e0e7ff; padding: 10px 20px; border-radius: 8px;">
                            ${otp}
                        </span>
                    </div>
                    <p style="color: #666; font-size: 14px;">This OTP is valid for 10 minutes.</p>
                    <p style="color: #666; font-size: 14px;">If you didn't request this code, please ignore this email.</p>
                </div>
                <div style="background: #002147; padding: 15px; text-align: center;">
                    <p style="color: #888; font-size: 12px; margin: 0;">© ${new Date().getFullYear()} Club Connect - Walchand College of Engineering</p>
                </div>
            </div>
        `,
    });
}

export default { sendEmail, sendPasswordResetEmail, sendClubInvitationEmail, sendOtpEmail };
