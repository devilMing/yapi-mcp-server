const axios = require('axios');
require('dotenv').config();

const YAPI_BASE_URL = process.env.YAPI_BASE_URL;
const YAPI_TOKEN = process.env.YAPI_TOKEN;
const YAPI_PROJECT_ID = process.env.YAPI_PROJECT_ID;

if (!YAPI_BASE_URL || !YAPI_TOKEN || !YAPI_PROJECT_ID) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

async function getInterfaceDetails(interfaceId) {
  try {
    const response = await axios.get(`${YAPI_BASE_URL}/api/interface/get`, {
      params: {
        token: YAPI_TOKEN,
        id: interfaceId
      }
    });
    return response.data.data;
  } catch (error) {
    console.error("Error fetching interface details:", error);
    throw error;
  }
}

async function listInterfaces() {
  try {
    const response = await axios.get(`${YAPI_BASE_URL}/api/interface/list`, {
      params: {
        token: YAPI_TOKEN,
        project_id: YAPI_PROJECT_ID,
        page: 1,
        limit: 100
      }
    });
    return response.data.data.list;
  } catch (error) {
    console.error("Error listing interfaces:", error);
    throw error;
  }
}

async function getInterfaceByPath(path) {
  try {
    const interfaces = await listInterfaces();
    const interfaceItem = interfaces.find(item => item.path === path);
    if (!interfaceItem) {
      throw new Error(`Interface with path ${path} not found`);
    }
    return await getInterfaceDetails(interfaceItem._id);
  } catch (error) {
    console.error("Error getting interface by path:", error);
    throw error;
  }
}

async function getInterfaceByName(name) {
  try {
    const interfaces = await listInterfaces();
    const interfaceItem = interfaces.find(item => item.title === name);
    if (!interfaceItem) {
      throw new Error(`Interface with name ${name} not found`);
    }
    return await getInterfaceDetails(interfaceItem._id);
  } catch (error) {
    console.error("Error getting interface by name:", error);
    throw error;
  }
}

module.exports = {
  getInterfaceDetails,
  listInterfaces,
  getInterfaceByPath,
  getInterfaceByName
}; 