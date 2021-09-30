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
  const secondsOffset = 0; //Add a X seconds offset to make sure the server is ready
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
        const splitSlots = splitSlot(resource.ID, resource.Name, session);
        slots = [...slots, ...splitSlots];
      }
    }
  }

  slots = sortSlots(slots);

  log({
    text: "Available slots:",
    data: slots,
    tag: config.tag,
  });

  return slots;
};

const isAvailable = (session) =>
  session.Category === 0 && session.SubCategory === 0;

const splitSlot = (
  resourceId,
  resourceName,
  { ID, StartTime, EndTime, Interval }
) => {
  const slots = [];
  const splits = (EndTime - StartTime) / Interval;

  [...Array(splits)].map((_, i) => {
    const offset = Interval * i;
    slots.push({
      resourceId,
      resourceName,
      sessionId: ID,
      start: StartTime + offset,
    });
  });

  return slots;
};

const sortSlots = (slots) =>
  slots.sort(function (a, b) {
    return a["start"] - b["start"];
  });

module.exports.getValidSlots = (config, slots) => {
  const validSlots = [];
  for (const slot of slots) {
    if (isValid(slot, config.start)) {
      validSlots.push(slot);
    }
  }

  if (validSlots.length === 0) {
    logError({
      text: `No available slots at ${config.start}:`,
      data: slots,
      tag: config.tag,
    });
  } else {
    log({
      text: `Valid slots at ${config.start}:`,
      data: validSlots,
      tag: config.tag,
    });
  }

  return validSlots;
};

const isValid = (slot, start) => slot.start === start * 60;
