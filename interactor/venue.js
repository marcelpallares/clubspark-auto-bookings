const { DateTime } = require("luxon");
const { fetchData, postData } = require("../api");
const { log, logError } = require("../logger");
const { timeoutPromise } = require("../utils");

module.exports.getVenueSettings = async (config) => {
  log({
    text: `1. Retrieving settings of ${config.venue} venue...`,
    tag: config.tag,
  });

  const { response, error } = await fetchData(
    config.baseApi,
    config.urls.VENUE_SETTINGS_URL
  );

  if (error) {
    logError({
      text: "Error on retrieving venue settings.",
      data: error,
      tag: config.tag,
    });
    return { error };
  }

  return { response };
};

module.exports.getSessions = async (config) => {
  log({
    text: `2. Fetching sessions on ${config.venue}...`,
    tag: config.tag,
  });

  const { response, error } = await fetchData(
    config.baseApi,
    config.urls.SESSIONS_URL,
    {
      startDate: config.date,
      endDate: config.date,
    }
  );

  if (error) {
    logError({
      text: "Error on fetching sessions.",
      data: error,
      tag: config.tag,
    });
    return { error };
  }

  log({
    text: "Sessions:",
    data: response.data,
    tag: config.tag,
  });

  return { response };
};

module.exports.waitIfNeeded = async (config, settings) => {
  const serverDate = settings.ServerDateTime;
  const timeToBook = settings.NewDayBookingAvailabilityTime;
  const secondsOffset = 1; //Add a X seconds offset to make sure the server is ready
  const daysInAdvanceToBook = settings.Roles[0].AdvancedBookingPeriod;

  const currentDate = DateTime.fromISO(serverDate, { zone: "utc" });
  const whenToBookDate = DateTime.fromISO(config.date, { zone: "utc" })
    .minus({ days: daysInAdvanceToBook })
    .plus({
      minutes: timeToBook,
      seconds: secondsOffset,
    });

  var diff = whenToBookDate.diff(currentDate).toMillis();
  const timeLeft = diff > 0 ? diff : 0;

  if (timeLeft > 0) {
    log({
      text: `Waiting for ${timeLeft / 1000} seconds...`,
      tag: config.tag,
    });
  }

  return await timeoutPromise(timeLeft);
};

module.exports.findAvailableSlots = (config, sessions) => {
  let slots = [];

  for (const resource of sessions.Resources) {
    for (const session of resource.Days[0].Sessions) {
      if (isAvailable(session)) {
        const splitSlots = splitSlot(resource.ID, session);
        slots = [...slots, ...splitSlots];
      }
    }
  }

  slots = sortSlots(slots);

  log({
    text: `${slots.length} slots available on ${config.date}:`,
    data: slots,
    tag: config.tag,
  });

  return slots;
};

const isAvailable = (session) =>
  session.Name === "Default" &&
  session.Category === 0 &&
  session.SubCategory === 0;

const splitSlot = (resourceId, { ID, StartTime, EndTime, Interval }) => {
  const slots = [];
  // const interval = Interval * maximumIntervals;
  // const minutes = EndTime - StartTime;
  // const intervals = minutes / Interval;

  // console.log("ID", ID);
  // console.log("StartTime", StartTime);
  // console.log("EndTime", EndTime);
  // console.log("Interval", Interval);
  // console.log("maximumIntervals", config.maximumIntervals);
  // console.log("minutes", minutes);
  // console.log("intervals", intervals);

  // const splits = (EndTime - StartTime) / interval;
  const splits = (EndTime - StartTime) / Interval;

  // console.log("SPLITS", splits);

  [...Array(splits)].map((_, i) => {
    const offset = Interval * i;
    slots.push({
      resourceId,
      sessionId: ID,
      start: StartTime + offset,
      end: StartTime + Interval + offset,
    });
  });

  return slots;
};

const sortSlots = (slots) =>
  slots.sort(function (a, b) {
    return a["start"] - b["end"];
  });

module.exports.getSlot = (config, slots) => {
  for (const slot of slots) {
    if (isValid(slot, config.start, config.end)) {
      log({
        text: `Selected slot:`,
        data: slot,
        tag: config.tag,
      });

      return slot;
    }
  }

  logError({
    text: `No available slots between ${config.start} and ${config.end} :(`,
    data: slots,
    tag: config.tag,
  });

  return undefined;
};

const isValid = (slot, start, end) =>
  slot.start >= start * 60 && slot.end <= end * 60;

module.exports.acceptTerms = async (config) => {
  log({
    text: `Accepting terms of ${config.venue}...`,
    tag: config.tag,
  });

  const { response, error } = await postData(
    config.baseApi,
    config.urls.ACCEPT_TERMS_URL,
    {
      ReturnUrl: "/",
      AuthorityName: "",
      AgreeTermsAndConditions: true,
    }
  );

  if (error) {
    logError({
      text: "Error on accepting terms.",
      data: error,
      tag: config.tag,
    });
    return { error };
  }

  log({
    text: "Terms successfully accepted.",
    tag: config.tag,
  });

  return { response };
};
