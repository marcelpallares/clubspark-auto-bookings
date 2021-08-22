module.exports.DEFAULT_BOOKING_PARAMS = {
  Duration: 60,
  Source: "Android",
};

module.exports.AUTH_URL = "https://auth.clubspark.uk";
module.exports.SIGN_IN_URL = "/account/signin";
module.exports.GET_SECURITY_TOKEN_URL = "/issue/wsfed";

module.exports.BASE_URL = "https://clubspark.lta.org.uk";
module.exports.USER_URL = "/v2/User/GetCurrentUser";

module.exports.MOBILE_BASE_URL = "https://api.clubspark.uk";
module.exports.MOBILE_SIGN_IN_URL = "/issue/oauth2/token";

module.exports.getVenueSettingsUrl = (venue) =>
  `/v0/VenueBooking/${venue}/GetSettings`;

module.exports.getSessionsUrl = (venue) =>
  `/v0/VenueBooking/${venue}/GetVenueSessions`;

module.exports.getMobileBookingUrl = (venue) =>
  `/v0/VenueBooking/${venue}/RequestSession`;

module.exports.getBookingUrl = (venue) => `/${venue}/Booking/Book`;

module.exports.getConfirmBookingUrl = (venue) =>
  `/${venue}/Booking/ConfirmBooking`;

module.exports.getAcceptTermsUrl = (venue) =>
  `/${venue}/Booking/TermsOfUse?returnUrl=/`;

module.exports.getConfirmBookingParams = (
  VenueContactID,
  { FirstName, LastName }
) => {
  return {
    ...this.DEFAULT_BOOKING_PARAMS,
    MatchID: "",
    RoleID: "",
    CourtCost: 0.0,
    LightingCost: 0.0,
    MembershipCost: 0,
    MembersCost: 0,
    GuestsCost: 0,
    Token: "",
    Format: "None",
    Source: "",
    Contacts: [
      {
        VenueContactName: "",
        IsPrimary: true,
        IsMember: "False",
        VenueContactID,
        FirstName,
        LastName,
      },
    ],
  };
};
