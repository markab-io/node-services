var GoogleStrategy = require("passport-google-oauth").OAuth2Strategy;

const google = ({
  passport,
  clientId,
  clientSecret,
  callbackURL,
  onVerify,
}) => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: clientId,
        clientSecret: clientSecret,
        callbackURL,
      },
      function (accessToken, refreshToken, profile, cb) {
        let providerName = "google";
        onVerify({ accessToken, refreshToken, profile, cb, providerName });
      }
    )
  );
};

export default google;
