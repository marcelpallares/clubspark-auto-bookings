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
    ResourceID: config.selectedSlot.resourceId,
    SessionID: config.selectedSlot.sessionId,
    Date: config.date,
    StartTime: config.selectedSlot.start,
    ...DEFAULT_BOOKING_PARAMS,
  };

  log({
    text: "3. Booking with the next params:",
    data: params,
    tag: config.tag,
  });

  const { response, error } = await postData(
    config.baseApi,
    config.urls.MOBILE_BOOKING_URL,
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

  log({
    text: "Booking response:",
    data: response.data,
    tag: config.tag,
  });

  return { response };
};

module.exports.isBookingConfirmed = (config, response) => {
  const result = response.data.Result;
  const isConfirmed = result === 0;

  log({
    text: `Booking confirmed?: ${isConfirmed}`,
    tag: config.tag,
  });

  return isConfirmed;
};
