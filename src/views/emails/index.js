const handlebars = require("handlebars");
const fs = require("fs");
const path = require("path");

const testEmailTemplateSrc = fs.readFileSync(
  path.join(__dirname, "./test.hbs"),
  "utf8"
);
const forgotPasswordEmailTemplateSrc = fs.readFileSync(
  path.join(__dirname, "./forgot-password.hbs"),
  "utf8"
);
const emailVerificationTemplateSrc = fs.readFileSync(
  path.join(__dirname, "./verify-email.hbs"),
  "utf8"
);
const eventRegistrationTemplateSrc = fs.readFileSync(
  path.join(__dirname, "./event-registration.hbs"),
  "utf8"
);
const entryPassVerificationTemplateSrc = fs.readFileSync(
  path.join(__dirname, "./entry-pass-verification.hbs"),
  "utf8"
);
const entryPassRejectionTemplateSrc = fs.readFileSync(
  path.join(__dirname, "./entry-pass-rejection.hbs"),
  "utf8"
);
const testEmailTemplate = handlebars.compile(testEmailTemplateSrc);
const forgotPasswordEmailTemplate = handlebars.compile(
  forgotPasswordEmailTemplateSrc
);
const emailVerificationTemplate = handlebars.compile(
  emailVerificationTemplateSrc
);
const eventRegistrationTemplate = handlebars.compile(
  eventRegistrationTemplateSrc
);
const entryPassVerificationTemplate = handlebars.compile(
  entryPassVerificationTemplateSrc
);
const entryPassRejectionTemplate = handlebars.compile(
  entryPassRejectionTemplateSrc
);

const templates = {
  test: testEmailTemplate,
  forgotPassword: forgotPasswordEmailTemplate,
  emailVerification: emailVerificationTemplate,
  eventRegistration: eventRegistrationTemplate,
  entryPassVerification: entryPassVerificationTemplate,
  entryPassRejection: entryPassRejectionTemplate,
};

module.exports = templates;
