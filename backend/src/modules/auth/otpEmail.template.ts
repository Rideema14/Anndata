import { env } from '../../config/env';

export function otpEmailHtml({ name, otp, purpose }: { name: string; otp: string; purpose: 'REGISTER' | 'RESET_PASSWORD' }): string {
  const heading = purpose === 'RESET_PASSWORD' ? 'Reset your password' : 'Verify your email';
  const bodyLine =
    purpose === 'RESET_PASSWORD'
      ? 'Use the code below to reset your Agri Marketplace password.'
      : 'Use the code below to verify your email and finish creating your Agri Marketplace account.';

  return `
  <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; color: #1f2937;">
    <h2 style="color: #15803d;">${heading}</h2>
    <p>Hi ${name || 'there'},</p>
    <p>${bodyLine}</p>
    <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; text-align: center; margin: 24px 0;">
      <span style="font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #166534;">${otp}</span>
    </div>
    <p>This code expires in ${env.otp.expiryMinutes} minutes. If you didn't request this, you can safely ignore this email.</p>
    <p style="margin-top: 32px; font-size: 12px; color: #6b7280;">Agri Marketplace</p>
  </div>`;
}
