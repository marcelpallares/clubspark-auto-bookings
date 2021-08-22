const axios = require("axios");
const { updateAxiosToken, fetchData, postData } = require("../api");
const { log, logError } = require("../logger");

module.exports.getUser = async (apiConfig, { email, password }) => {
  let config = apiConfig;
  log({
    text: `Retrieving user ${email}...`,
    tag: config.tag,
  });

  const responseToken = await getToken(config, email, password);
  if (responseToken.error) return false;

  config.token = responseToken.token;
  config = updateAxiosToken(config);

  const { response, error } = await getUserData(config);
  if (error) return false;

  config.user = response.data;

  return config;
};

const getToken = async (config, email, password) => {
  log({
    text: "1. Get user token...",
    tag: config.tag,
  });

  const params = {
    username: email,
    password,
    scope: "https://api.clubspark.uk/token/",
    grant_type: "password",
  };

  const { response, error } = await postData(
    config.authApi,
    config.urls.MOBILE_SIGN_IN_URL,
    params
  );

  if (error) {
    logError({
      text: "Error on retrieving user token.",
      data: error,
      tag: config.tag,
    });

    return { error };
  }

  log({
    text: `User token retrieved: ${response.data.access_token}`,
    tag: config.tag,
  });

  return { token: response.data.access_token };
};

const getUserData = async (config) => {
  log({
    text: "2. Recovering the user data...",
    tag: config.tag,
  });

  const { response, error } = await fetchData(
    config.baseApi,
    config.urls.USER_URL
  );

  if (error) {
    logError({
      text: "Error on recovering the user data.",
      data: error,
      tag: config.tag,
    });

    return { error };
  }

  log({
    text: `Logged in as ${response.data.FirstName} ${response.data.LastName}!`,
    tag: config.tag,
  });

  return { response };
};
