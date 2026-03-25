const nodemailer = require('nodemailer');

/**
 * Sends an email using nodemailer with SMTP settings from environment variables.
 * @param {object} options - The email options.
 * @param {string} options.to - The recipient's email address.
 * @param {string} options.subject - The subject of the email.
 * @param {string} options.html - The HTML body of the email.
 */
const sendEmail = async (options) => {
    // 1. Create a transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: true, // Use SSL
        auth: {
            user: process.env.SMTP_EMAIL, // Your Gmail address
            pass: process.env.SMTP_PASSWORD // Your Gmail App Password
        }
    });

    // 2. Define the email options
    const mailOptions = {
        from: `DATN-CNC <${process.env.SMTP_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html
    };

    // 3. Send the email
    try {
        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
    } catch (error) {
        console.error('Error sending email: ', error);
        // In a real app, you might want to handle this error more gracefully
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;
