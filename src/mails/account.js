const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = ({ email, name }) => {
    sgMail.send({
        to: email,
        from: 'firerod96@gmail.com',
        subject: 'Thanks for joining in!',
        text: `Welcome to the app, ${name}. Let me know how you get along with the app.`
    });
};

const sendCancelationEmail = ({ email, name }) => {
    sgMail.send({
        to: email,
        from: 'firerod96@gmail.com',
        subject: 'Task Manager Account Cancelation',
        text: `Sorry to see you go ${name}... Please share your thoughts on how our service could have been better.`
    })
};

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
};