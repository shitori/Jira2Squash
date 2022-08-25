var dotenv = require('dotenv');
dotenv.config();
var infoCO = {
  proxy: {
    host: process.env.PROXY_HOST,
    port: process.env.PROXY_PORT,
    auth: { username: process.env.PROXY_USERNAME, password: process.env.PROXY_PASSWORD }
  },
  headers: {
    Cookie: "JSESSIONID="
  },

}

function setJSessionID(id) {
  infoCO.headers.Cookie = "JSESSIONID=" + id
}

module.exports = { infoCO, setJSessionID }