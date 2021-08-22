const dateFormat = require("dateformat");

module.exports.getNextWeekDate = () => {
  // 2021-04-23
  var date = new Date();
  date.setDate(date.getDate() + 7);

  return dateFormat(date, "yyyy-mm-dd");
};

module.exports.timeoutPromise = (interval) =>
  new Promise((resolve) => {
    setTimeout(function () {
      resolve(true);
    }, interval);
  });
