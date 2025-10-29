const nodemailer = require("nodemailer");
const templates = require("./../views/emails");
const { DateTime } = require("luxon");

const transporter = nodemailer.createTransport({
  host: process.env.MAILING_SERVICE_HOST,
  port: process.env.MAILING_SERVICE_PORT,
  auth: {
    user: process.env.MAILING_SERVICE_USER,
    pass: process.env.MAILING_SERVICE_USER_PASSWORD,
  },
});

class Mailer {
  static async sendMail({ from, to, subject, text, html }) {
    return await new Promise((resolve, reject) => {
      transporter.sendMail({ from, to, subject, text, html }, (err, info) => {
        if (err) {
          reject(err);
        }
        resolve(info);
      });
    });
  }

  static async sendTestMail() {
    return await Mailer.sendMail({
      from: process.env.MAILING_SERVICE_USER,
      to: "test@gmail.com",
      subject: "Test Handlebars",
      html: templates.test({
        message: "This is a test message from JS",
      }),
    });
  }

  static async sendVerificationEmail({ email, verificationToken, user }) {
    const verificationUrl = `${process.env.CLIENT_EMAIL_VERIFICATION_URL}?token=${verificationToken}`;
    return await Mailer.sendMail({
      from: process.env.MAILING_SERVICE_USER,
      to: email,
      subject: "Verify your email for Fest Management",
      html: templates.emailVerification({
        verificationUrl,
        user,
        currentYear: new Date().getFullYear()
      }),
    });
  }

  static async sendEventRegistrationEmail({ participant, event, ticketId, ticketQrCode }) {
    const eventDate = DateTime.fromISO(event.startDate);
    const eventDetailsUrl = `${process.env.CLIENT_URL}/events/${event._id}`;

    return await Mailer.sendMail({
      from: process.env.MAILING_SERVICE_USER,
      to: participant.email,
      subject: `Registration Confirmed: ${event.name}`,
      html: templates.eventRegistration({
        participant,
        event: {
          ...event,
          date: eventDate.toLocaleString(DateTime.DATE_FULL),
          time: eventDate.toLocaleString(DateTime.TIME_SIMPLE),
        },
        ticketId,
        ticketQrCode,
        eventDetailsUrl,
        currentYear: new Date().getFullYear(),
        festName: process.env.FEST_NAME || 'Fest Management'
      }),
    });
  }

  static async sendForgotPasswordMail({ to, resetPasswordToken, user }) {
    const redirectUrl = `${process.env.CLIENT_RESET_PASSWORD_URL}?token=${resetPasswordToken}`;
    return await Mailer.sendMail({
      from: process.env.MAILING_SERVICE_USER,
      to,
      subject: "Cieszyc Password Reset",
      html: templates.forgotPassword({
        redirectUrl,
        user,
        company: {
          name: "Cieszyc",
          email: "dummy@cieszyc.app",
          address: {
            street: "Dahiya Street",
            city: "Dhanbad",
            state: "Jharkhand",
            country: "India",
            zip: "826004",
          },
        },
      }),
    });
  }
}

module.exports = Mailer;
