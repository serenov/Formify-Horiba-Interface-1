const FtpSrv = require("ftp-srv");
const fs = require("fs");
const path = require("path");

async function startFtpServer(config) {
  // Ensure the FTP directory exists
  if (!fs.existsSync(config.path)) {
    fs.mkdirSync(config.path, { recursive: true });
  }

  const ftpServer = new FtpSrv(`ftp://192.168.1.1:${config.port || 21}`);

  ftpServer.on("login", ({ username, password }, resolve, reject) => {
    if (username === config.user && password === config.password) {
      return resolve({ root: config.path });
    }
    return reject(new Error("Invalid username or password"));
  });

  ftpServer.on("server-error", (error) => {
    console.error("FTP server error:", error);
  });

  await ftpServer.listen();
  console.log("FTP Server started on port", config.port || 21);

  return ftpServer;
}

function stopFtpServer(ftpServer) {
  if (ftpServer) {
    ftpServer.close();
    console.log("FTP Server stopped");
  }
}

module.exports = {
  startFtpServer,
  stopFtpServer,
};
