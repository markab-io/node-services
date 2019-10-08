// basic route (http://localhost:8080)
const express = require("express");
const googlePassport = require("./strategies/google.js");
const localPassport = require("./strategies/local.js");
const twitterPassport = require("./strategies/twitter.js");
const facebookPassport = require("./strategies/facebook.js");

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router();

const parseCallbackHost = host => {
  if (host.indexOf("http") === -1) {
    return `http://${host}`;
  }
  return host;
};

module.exports = function({
  config,
  passport,
  onVerify,
  onSuccess,
  onLoginFail,
  onRegister,
  onResendEmailConfirmation,
  onEmailVerify,
  onPasswordReset,
  onPasswordResetConfirm,
  onPasswordChange
}) {
  apiRoutes.use(passport.initialize());

  apiRoutes.use(passport.session());

  passport.serializeUser(function(user, done) {
    done(null, user);
  });

  passport.deserializeUser(function(user, done) {
    done(null, user);
  });

  //local strategy
  localPassport({
    passport,
    onVerify
  });

  apiRoutes.post("/auth/resend-email-confirmation", (req, res) => {
    let { email } = req.body;
    onResendEmailConfirmation({ email }, req, res);
  });

  apiRoutes.get("/auth/email-confirmation", (req, res) => {
    let { email, token } = req.query;
    onEmailVerify({ email, token }, req, res);
  });

  apiRoutes.post("/auth/change-password", (req, res) => {
    let { token, email, newPassword } = req.body;
    onPasswordChange({ token, email, newPassword }, req, res);
  });

  apiRoutes.get("/auth/forgot-password-confirm", (req, res) => {
    let { token, email } = req.query;
    onPasswordResetConfirm({ token, email }, req, res);
  });

  apiRoutes.post("/auth/forgot-password", (req, res) => {
    let { email } = req.body;
    onPasswordReset({ email }, req, res);
  });

  apiRoutes.post("/auth/register", (req, res) => {
    onRegister(req.body, req, res);
  });

  apiRoutes.post(
    "/auth",
    passport.authenticate("local", { failureRedirect: "/error" }),
    (req, res) => {
      onSuccess("local", req.user, res);
    }
  );

  //client ID and secret for google
  let googleClientId = config.get("auth.google.clientId");
  let googleClientSecret = config.get("auth.google.clientSecret");
  let googleCallbackURL = `${parseCallbackHost(
    config.get("server.host")
  )}:${config.get("server.port")}/auth/google/callback`;

  googlePassport({
    passport,
    clientId: googleClientId,
    clientSecret: googleClientSecret,
    callbackURL: googleCallbackURL,
    onVerify
  });

  apiRoutes.get("/error", function(req, res) {
    onLoginFail(req, res, "message");
  });

  apiRoutes.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile"]
    })
  );

  apiRoutes.get(
    "/auth/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/error"
    }),
    (req, res) => {
      onSuccess("google", req.user, res);
    }
  );

  //client ID and secret for twitter
  // let twitterClientId = config.get("auth.twitter.clientId");
  // let twitterClientSecret = config.get("auth.twitter.clientSecret");
  // let twitterCallbackURL = `http://localhost:8080/auth/twitter/callback`;
  // twitterPassport({
  //   passport,
  //   clientId: twitterClientId,
  //   clientSecret: twitterClientSecret,
  //   callbackURL: twitterCallbackURL,
  //   onVerify
  // });
  apiRoutes.get("/auth/twitter", passport.authenticate("twitter"));

  apiRoutes.get(
    "/auth/twitter/callback",
    passport.authenticate("twitter", { failureRedirect: "/error" }),
    function(req, res) {
      // Successful authentication, redirect home.
      let redirectUrl = `${config.get("redirectUrl")}?jwt=${req.user.jwtToken}`;
      res.redirect(redirectUrl);
    }
  );

  //client ID and secret for twitter
  // let facebookClientId = config.get("auth.facebook.clientId");
  // let facebookClientSecret = config.get("auth.facebook.clientSecret");
  // let facebookCallbackURL = `http://localhost:8080/auth/facebook/callback`;
  // facebookPassport({
  //   passport,
  //   clientId: facebookClientId,
  //   clientSecret: facebookClientSecret,
  //   callbackURL: facebookCallbackURL,
  //   onVerify
  // });
  apiRoutes.get("/auth/facebook", passport.authenticate("facebook"));

  apiRoutes.get(
    "/auth/facebook/callback",
    passport.authenticate("facebook", { failureRedirect: "/error" }),
    function(req, res) {
      // Successful authentication, redirect home.
      let redirectUrl = `${config.get("redirectUrl")}?jwt=${req.user.jwtToken}`;
      res.redirect(redirectUrl);
    }
  );

  return apiRoutes;
};
