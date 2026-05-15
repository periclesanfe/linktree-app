const logger = require('../utils/logger');

const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildResetEmail = ({ code, username }) => {
    const safeUsername = escapeHtml(username || 'usuario');
    const safeCode = escapeHtml(code);
    const appUrl = process.env.APP_URL || 'https://meuhub.app.br';

    return {
        subject: 'Codigo de recuperacao de senha - MeuHub',
        text: [
            `Ola, ${username || 'usuario'}.`,
            '',
            `Seu codigo de recuperacao de senha e: ${code}`,
            '',
            'Ele expira em 15 minutos. Se voce nao solicitou este codigo, ignore este email.',
            '',
            `MeuHub: ${appUrl}`,
        ].join('\n'),
        html: `
            <div style="font-family: Arial, sans-serif; color: #3D3D3D; line-height: 1.5;">
                <p>Ola, ${safeUsername}.</p>
                <p>Seu codigo de recuperacao de senha e:</p>
                <p style="font-size: 28px; letter-spacing: 6px; font-weight: 700; color: #E8A87C;">${safeCode}</p>
                <p>Ele expira em 15 minutos.</p>
                <p>Se voce nao solicitou este codigo, ignore este email.</p>
                <p><a href="${escapeHtml(appUrl)}" style="color: #D4956B;">MeuHub</a></p>
            </div>
        `,
    };
};

const sendWithResend = async ({ to, subject, text, html }) => {
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            from: process.env.MAIL_FROM,
            to,
            subject,
            text,
            html,
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Resend email failed: ${response.status} ${body}`);
    }

    return response.json().catch(() => ({}));
};

const sendPasswordResetCode = async ({ to, code, username }) => {
    const email = buildResetEmail({ code, username });

    if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
        await sendWithResend({ to, ...email });
        logger.info('Password reset email sent', { to, provider: 'resend' });
        return { sent: true, provider: 'resend' };
    }

    if (process.env.NODE_ENV !== 'production' || process.env.MAIL_DEV_LOG_CODES === 'true') {
        logger.warn('Password reset email provider not configured. Dev reset code generated.', {
            to,
            code,
        });
        return { sent: false, provider: 'dev-log' };
    }

    logger.error('Password reset email provider not configured in production', { to });
    return { sent: false, provider: 'none' };
};

module.exports = {
    sendPasswordResetCode,
};
