const { getUser } = require("./auth");
const {
  getVenueSettings,
  getSessions,
  waitIfNeeded,
  findAvailableSlots,
  getValidSlots,
} = require("./venue");
const { book, isBookingConfirmed } = require("./book");
const { getMobileApiConfig } = require("../api");
const { log } = require("../logger");

module.exports.makeBooking = async ({ venue, date, start, end, userData }) => {
  let config = getMobileApiConfig(venue);
  config.tag = userData.email;
  config.date = date;
  config.start = start;
  config.end = end;

  config = await getUser(config, userData);

  log({
    text: `Starting the booking process.`,
    tag: config.tag,
  });

  const venueSettings = await getVenueSettings(config);
  if (isError(venueSettings)) return false;

  const sessions = await getSessions(config);
  if (isError(sessions)) return false;

  const slots = findAvailableSlots(config, sessions.response.data);
  config.validSlots = getValidSlots(config, slots);

  await waitIfNeeded(config, venueSettings.response.data);

  while (slotsAvailable(config.validSlots)) {
    config.selectedSlot = config.validSlots[0];
    config.validSlots.splice(0, 1); //Remove selected slot from array

    log({
      text: `Trying to book at ${config.selectedSlot.start / 60} in ${
        config.selectedSlot.resourceName
      }!`,
      tag: config.tag,
    });

    const booking = await book(config);
    if (isError(booking)) continue;
    if (isBookingConfirmed(config, booking.response))
      return config.selectedSlot;
  }

  return false;
};

const isError = ({ error }) => error !== undefined;
const slotsAvailable = (slots) => slots.length > 0;
