const { getUser } = require("./auth");
const {
  getVenueSettings,
  getSessions,
  waitIfNeeded,
  findAvailableSlots,
  getSlot,
} = require("./venue");
const {
  book,
  confirmBooking,
  shouldAcceptTerms,
  isBookingConfirmed,
} = require("./book");
const { getApiConfig } = require("../api");
const { log } = require("../logger");

module.exports.makeBooking = async ({ venue, date, start, end, userData }) => {
  const config = getApiConfig(venue);
  config.tag = userData.email;
  config.date = date;
  config.start = start;
  config.end = end;

  config.user = await getUser(config, userData);

  log({
    text: `Starting the booking process.`,
    tag: config.tag,
  });

  const venueSettings = await getVenueSettings(config);
  if (isError(venueSettings)) return false;

  config.venueId = venueSettings.response.data.VenueID;
  config.venueContactId = getVenueContactID(config);
  config.maximumIntervals = getMaximumIntervals(venueSettings.response.data);

  const sessions = await getSessions(config);
  if (isError(sessions)) return false;

  const slots = findAvailableSlots(config, sessions.response.data);
  if (noSlotsAvailable(slots)) return false;

  config.selectedSlot = getSlot(config, slots);
  if (!config.selectedSlot) return false;

  await waitIfNeeded(config, venueSettings.response.data);

  log({
    text: `Trying to book at ${config.selectedSlot.start / 60} - ${
      config.selectedSlot.end / 60
    }!`,
    tag: config.tag,
  });

  let booking = null,
    attempt = 0;

  while (shouldTryBooking(booking, attempt)) {
    booking = await book(config);
    if (isError(booking)) return false;
    if (await shouldAcceptTerms(config, booking.response)) attempt++;
  }
  if (isBookingConfirmed(config, booking.response)) return config.selectedSlot;

  const confirmation = await confirmBooking({ config, token: booking.token });
  if (isError(confirmation)) return false;

  return config.selectedSlot;
};

const isError = ({ error }) => error !== undefined;
const noSlotsAvailable = (slots) => slots.length === 0;
const shouldTryBooking = (booking, attempt) =>
  (!booking && attempt == 0) || attempt == 1;

const getVenueContactID = (config) => {
  const contact = config.user.VenueContacts.filter((contact) => {
    return contact.VenueID === config.venueId;
  })[0];
  return contact ? contact.VenueContactID : "";
};

const getMaximumIntervals = (settings) =>
  settings.Roles[0].MaximumBookingIntervals;
