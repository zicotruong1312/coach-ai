const axios = require('axios');

const getApi = () => {
  return axios.create({
    baseURL: 'https://api.henrikdev.xyz',
    headers: {
      'Authorization': process.env.HENRIK_API_KEY
    }
  });
};

async function getAccount(name, tag) {
  try {
    const api = getApi();
    const response = await api.get(`/valorant/v1/account/${encodeURIComponent(name)}/${encodeURIComponent(tag)}`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return null;
    }
    console.error(`Henrik API Error (getAccount): ${error.message}`);
    throw error;
  }
}

async function getMatches(region, name, tag, size = 5) {
  try {
    const api = getApi();
    const response = await api.get(`/valorant/v3/matches/${region}/${encodeURIComponent(name)}/${encodeURIComponent(tag)}?size=${size}`);
    return response.data;
  } catch (error) {
    console.error(`Henrik API Error (getMatches): ${error.message}`);
    throw error;
  }
}

module.exports = {
  getAccount,
  getMatches
};
