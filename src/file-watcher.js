const chokidar = require("chokidar");
const path = require("path");

function startFileWatcher(dirPath, callback) {
  const watcher = chokidar.watch(dirPath, {
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  watcher
    .on("add", (filePath) => {
      console.log(`New ASTM file detected: ${filePath}`);
      callback(filePath);
    })
    .on("error", (error) => {
      console.error(`File watcher error: ${error}`);
    });

  console.log(`Watching for .astm files in ${dirPath}`);
  return watcher;
}

function stopFileWatcher(watcher) {
  if (watcher) {
    watcher.close();
    console.log("File watcher stopped");
  }
}

module.exports = {
  startFileWatcher,
  stopFileWatcher,
};
