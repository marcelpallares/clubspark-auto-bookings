const { makeBooking } = require("./mobile-interactor");
const { getNextWeekDate } = require("./utils");
const { log, logError } = require("./logger");

const date = getNextWeekDate();
const venue = "SouthwarkPark";
const account_1_email = process.env.ACCOUNT_1_EMAIL;
const account_1_pass = process.env.ACCOUNT_1_PASS;
const account_2_email = process.env.ACCOUNT_2_EMAIL;
const account_2_pass = process.env.ACCOUNT_2_PASS;

// As we want to make 2 bookings in parallel and we cannot depend on the calls responses
// to capture the venue settings data, we need to assume the intervals for each slot.
const interval = 1;

const start = 17.5;
const start2 = start + interval;
const end = 19.5;

module.exports.handler = async function (_event, _context, _cb) {
  // Run all 2 bookings in parallel
  await Promise.all([
    book(account_1_email, account_1_pass, start),
    book(account_2_email, account_2_pass, start2),
  ]);
};

const book = async (email, password, start) => {
  const booking = await makeBooking({
    venue,
    date,
    start,
    end,
    userData: { email, password },
  });

  logResults({ email, booking, start });

  return booking;
};

const logResults = ({ email, booking, start }) => {
  if (booking) {
    log({
      text: `Booking at ${booking.start / 60} successful!`,
      data: booking,
      tag: email,
    });
  } else {
    logError({
      text: `Booking at ${start} unsuccessful :(`,
      tag: email,
    });
  }
};
