const { create } = require("axios");
const { CookieJar } = require("tough-cookie");
const axiosCookieJarSupport = require("axios-cookiejar-support").default;

const {
  AUTH_URL,
  BASE_URL,
  MOBILE_BASE_URL,
  MOBILE_SIGN_IN_URL,
  USER_URL,
  SIGN_IN_URL,
  GET_SECURITY_TOKEN_URL,
  getVenueSettingsUrl,
  getSessionsUrl,
  getMobileBookingUrl,
  getBookingUrl,
  getConfirmBookingUrl,
  getAcceptTermsUrl,
} = require("./constants");

const getConfig = (venue) => {
  return {
    venue,
    urls: {
      BASE_URL,
      USER_URL,
      SIGN_IN_URL,
      GET_SECURITY_TOKEN_URL,
      VENUE_SETTINGS_URL: getVenueSettingsUrl(venue),
      SESSIONS_URL: getSessionsUrl(venue),
      BOOKING_URL: getBookingUrl(venue),
      CONFIRM_BOOKING_URL: getConfirmBookingUrl(venue),
      ACCEPT_TERMS_URL: getAcceptTermsUrl(venue),
    },
  };
};

module.exports.getApiConfig = (venue) => {
  const cookieJar = new CookieJar();
  const authAxios = create({
    jar: cookieJar,
    baseURL: AUTH_URL,
    withCredentials: true,
  });
  const axios = create({
    jar: cookieJar,
    baseURL: BASE_URL,
    withCredentials: true,
  });

  axiosCookieJarSupport(authAxios);
  axiosCookieJarSupport(axios);

  return {
    baseApi: axios,
    authApi: authAxios,
    ...getConfig(venue),
  };
};

const getMobileConfig = (venue) => {
  return {
    venue,
    urls: {
      USER_URL,
      MOBILE_SIGN_IN_URL,
      VENUE_SETTINGS_URL: getVenueSettingsUrl(venue),
      SESSIONS_URL: getSessionsUrl(venue),
      MOBILE_BOOKING_URL: getMobileBookingUrl(venue),
    },
  };
};

module.exports.getMobileApiConfig = (venue) => {
  const authAxios = create({
    baseURL: AUTH_URL,
    headers: {
      authorization:
        "Basic Y2x1YnNwYXJrLWFwcDpsWlV5UFU3cm4wd1VHYm00WndOenpLSFhWK25wY08rZjc1YUx2UWZ6cTJzPQ==",
    },
  });
  const axios = create({
    baseURL: MOBILE_BASE_URL,
    headers: {
      Host: "api.clubspark.uk",
      appversion: "1.0.3",
      appname: "cspl",
      "content-language": "en-US",
      "content-type": "application/json",
      "user-agent": "okhttp/3.12.1",
    },
  });

  return {
    baseApi: axios,
    authApi: authAxios,
    ...getMobileConfig(venue),
  };
};

module.exports.updateAxiosToken = (config) => {
  config.baseApi.interceptors.request.use((instanceConfig) => {
    instanceConfig.headers.authorization = `ClubSpark-Auth ${config.token}`;
    return instanceConfig;
  });
  return config;
};

module.exports.fetchData = async (axios, url, params) => {
  try {
    const response = await axios.get(url, { params });
    return { response };
  } catch (err) {
    return { error: err };
  }
};

module.exports.postData = async (axios, url, params) => {
  try {
    const response = await axios.post(url, params);
    return { response };
  } catch (err) {
    return { error: err };
  }
};
