const cheerio = require("cheerio");
const { acceptTerms } = require("./venue");
const { fetchData, postData } = require("../api");
const { log, logError } = require("../logger");

const {
  DEFAULT_BOOKING_PARAMS,
  getConfirmBookingParams,
} = require("../constants");

module.exports.book = async (config) => {
  const params = {
    VenueID: config.venueId,
    ResourceID: config.selectedSlot.resourceId,
    SessionID: config.selectedSlot.sessionId,
    Date: config.date,
    StartTime: config.selectedSlot.start,
    EndTime: config.selectedSlot.end,
    ...DEFAULT_BOOKING_PARAMS,
  };

  log({
    text: "3. Booking with the next params:",
    data: params,
    tag: config.tag,
  });

  const { response, error } = await fetchData(
    config.baseApi,
    config.urls.BOOKING_URL,
    params
  );

  if (error) {
    logError({
      text: "Error on making the booking.",
      data: error.response,
      tag: config.tag,
    });

    return { error };
  }

  const cheerioParsed = cheerio.load(response.data);
  const requestVerificationToken = cheerioParsed(
    "input[name='__RequestVerificationToken']"
  ).val();

  log({
    text: `Request verification token: ${requestVerificationToken}`,
    tag: config.tag,
  });

  return { response, token: requestVerificationToken };
};

module.exports.confirmBooking = async ({ config, token }) => {
  const params = {
    __RequestVerificationToken: token,
    VenueID: config.venueId,
    ResourceID: config.selectedSlot.resourceId,
    SessionID: config.selectedSlot.sessionId,
    Date: config.date,
    StartTime: config.selectedSlot.start,
    EndTime: config.selectedSlot.end,
    ...getConfirmBookingParams(config.venueContactId, config.user),
  };

  log({
    text: "4. Confirming the booking with the next params:",
    data: params,
    tag: config.tag,
  });

  const { response, error } = await postData(
    config.baseApi,
    config.urls.CONFIRM_BOOKING_URL,
    params
  );

  if (error) {
    logError({
      text: "Error on confirming the booking.",
      data: error.response,
      tag: config.tag,
    });

    return { error };
  }

  return { response };
};

module.exports.isBookingConfirmed = (config, response) => {
  // Success    = https://clubspark.lta.org.uk/BelairPark/Booking/BookingConfirmation/f83d55ef-6f71-4a03-b13a-29054bba3c60
  // Unsuccess  = https://clubspark.lta.org.uk/BelairPark/Booking/BookingUnsuccessful?reason=max

  const redirectUrl = response.request.res.responseUrl || response.request.path;
  log({
    text: `Redirect URL: ${redirectUrl}:`,
    tag: config.tag,
  });

  const isConfirmed =
    redirectUrl && redirectUrl.includes("BookingConfirmation");

  log({
    text: `Booking confirmed?: ${isConfirmed}`,
    tag: config.tag,
  });

  return isConfirmed;
};

module.exports.shouldAcceptTerms = async (config, response) => {
  // SouthwarkPark/Booking/TermsOfUse?returnUrl=....

  const redirectUrl = response.request.res.responseUrl || response.request.path;
  log({
    text: `Redirect URL: ${redirectUrl}:`,
    tag: config.tag,
  });

  const shouldAcceptTerms = redirectUrl && redirectUrl.includes("TermsOfUse");

  log({
    text: `Should accept terms?: ${shouldAcceptTerms}`,
    tag: config.tag,
  });

  if (shouldAcceptTerms) await acceptTerms(config);

  return shouldAcceptTerms;
};
