import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail', // You can change this to your preferred service
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `Nirosha Sweet House <${process.env.EMAIL_USER}>`,
            to: options.email,
            subject: options.subject,
            html: options.html || `<p>${options.message}</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent successfully to ${options.email}`);
    } catch (error) {
        console.error("Error sending email:", error);
        // Throw error so the calling function knows it failed
        throw new Error("Could not send email. Please check server email configurations.");
    }
};

export default sendEmail;
