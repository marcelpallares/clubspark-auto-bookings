const { makeBooking } = require("./mobile-interactor");
const { getNextWeekDate } = require("./utils");
const { log, logError } = require("./logger");

const date = getNextWeekDate();
const account_email = process.env.ACCOUNT_EMAIL;
const account_pass = process.env.ACCOUNT_PASS;
const venue = process.env.VENUE ?? "SouthwarkPark";
const start = process.env.START_TIME ?? 17.5;
const end = process.env.END_TIME ?? 19.5;

module.exports.handler = async function (_event, _context, _cb) {
  await book(account_email, account_pass, start);
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
