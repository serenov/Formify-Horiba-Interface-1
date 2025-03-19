const axios = require("axios");

async function sendDataToBackend(data, config) {
  try {
    const response = await axios({
      method: "post",
      url: config.url,
      headers: {
        "Content-Type": "application/json",
      },
      auth: {
        username: config.username,
        password: config.password,
      },
      data,
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error sending data to backend:", error);
    return {
      success: false,
      error: error.response
        ? `Error ${error.response.status}: ${error.response.statusText}`
        : error.message,
    };
  }
}

module.exports = {
  sendDataToBackend,
};
