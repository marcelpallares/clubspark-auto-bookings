const cheerio = require("cheerio");
const querystring = require("querystring");
const { fetchData, postData } = require("../api");
const { log, logError } = require("../logger");

module.exports.getUser = async (apiConfig, { email, password }) => {
  const config = apiConfig;
  log({
    text: `Retrieving user ${email}...`,
    tag: config.tag,
  });

  const response1 = await getRequestVerificationToken(config);
  if (response1.error) return false;

  const response2 = await sendEmailAndPassword(config, {
    email,
    password,
    token: response1.token,
  });
  if (response2.error) return false;

  const response3 = await getRequestSecurityToken(config);
  if (response3.error) return false;

  const response4 = await getCSAuthCookie(config, response3.token);
  if (response4.error) return false;

  const { response, error } = await getUserData(config);
  if (error) return false;

  return response.data;
};

const getRequestVerificationToken = async (config) => {
  log({
    text: "1. Get request verification token...",
    tag: config.tag,
  });

  const { response, error } = await fetchData(
    config.authApi,
    config.urls.SIGN_IN_URL
  );

  if (error) {
    logError({
      text: "Error on retrieving request verification token.",
      data: error,
      tag: config.tag,
    });

    return { error };
  }

  const cheerioParsed = cheerio.load(response.data);
  const requestVerificationToken = cheerioParsed(
    "input[name='__RequestVerificationToken']"
  ).val();

  return { token: requestVerificationToken };
};

const sendEmailAndPassword = async (config, { email, password, token }) => {
  log({
    text: "2. Sending email & password...",
    tag: config.tag,
  });

  const { response, error } = await postData(
    config.authApi,
    config.urls.SIGN_IN_URL,
    querystring.stringify({
      EmailAddress: email,
      Password: password,
      __RequestVerificationToken: token,
    })
  );

  if (error) {
    logError({
      text: "Error on getting idsauth cookie.",
      data: error,
      tag: config.tag,
    });

    return { error };
  }

  return { response };
};

const getRequestSecurityToken = async (config) => {
  log({
    text: "3. Get request security token...",
    tag: config.tag,
  });

  const { response, error } = await fetchData(
    config.authApi,
    config.urls.GET_SECURITY_TOKEN_URL,
    {
      wa: "wsignin1.0",
      wtrealm: "https://clubspark.lta.org.uk",
    }
  );

  if (error) {
    logError({
      text: "Error on retrieving request security token.",
      data: error,
      tag: config.tag,
    });

    return { error };
  }

  const cheerioParsed = cheerio.load(response.data);
  const requestSecurityToken = cheerioParsed("input[name='wresult']").val();

  return { token: requestSecurityToken };
};

const getCSAuthCookie = async (config, token) => {
  log({
    text: "4. Get final CSAuth cookie...",
    tag: config.tag,
  });

  const { response, error } = await postData(
    config.authApi,
    config.urls.BASE_URL,
    querystring.stringify({
      wa: "wsignin1.0",
      wresult: token,
    })
  );

  if (error) {
    logError({
      text: "Error on retrieving CSAuth cookie.",
      data: error,
      tag: config.tag,
    });

    return { error };
  }

  return { response };
};

const getUserData = async (config) => {
  log({
    text: "Recovering the user data...",
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
