const axios = require("axios");
const store = require("electron-store").default;

async function fetchToken(config) {
  try {
    const loginResponse = await axios({
      method: "post",
      url: `${config.url}/login`,
      headers: {
        "Content-Type": "application/json",
      },
      data: {
        username: config.username,
        password: config.password
      }
    });
    
    if (loginResponse.data && loginResponse.data.token) {
      
      return { 
        success: true, 
        token: loginResponse.data.token,
      };
    } else {
      throw new Error("Authentication successful but no token received");
    }
  } catch (error) {
    console.error("Error fetching authentication token:", error);
    return { 
      success: false, 
      error: error.response ? 
        `Error ${error.response.status}: ${error.response.statusText}` : 
        error.message
    };
  }
}


async function sendDataToBackend(data, config, token) {
  try {
    let headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    };
    
    const requestConfig = {
      method: "post",
      url: `${config.url}/user/horibaForm`,
      headers: headers,
      data
    };
    
    const response = await axios(requestConfig);

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
  fetchToken,
};
