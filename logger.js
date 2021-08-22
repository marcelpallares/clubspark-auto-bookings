"use strict";

const buildMessage = ({ text = "", data = null, tag = "" }) => {
  let message = "";
  if (tag) message += `${tag} ==> `;
  if (text) message += `${text}`;
  if (data) message += ` ${JSON.stringify(data, null, 2)}`;
  return message;
};

module.exports.log = (params) => {
  console.info(buildMessage(params));
};

const buildError = ({ text = "", tag = "" }) => {
  let message = "";
  if (tag) message += `${tag} ==> `;
  if (text) message += `${text}`;
  return message;
};

module.exports.logError = ({ text = "", data = null, tag = "" }) => {
  console.error(buildError({ text, tag }));
  if (data) console.error(tag, data);
};
