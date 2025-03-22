const fs = require("fs");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);

async function parseAstmFile(filePath) {
  try {
      const output = {
        sampleId: "",
        results: {},
      };

      const astmData = await readFileAsync(filePath, { encoding: 'ascii' });

      const cleanData = astmData.replace(
        /< ?EOT >|<ENQ>|<ACK>|<STX>|<ETX>|<CR>|<LF>/g,
        ""
      );

      const lines = cleanData.split("\n").filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (line.includes("O|")) {
          const orderParts = line.split("|");
          if (orderParts.length > 2) {
            output.sampleId = orderParts[2];
            output.results.sampleId = orderParts[2];
          }
          break;
        }
      }

      for (const line of lines) {
        if (line.includes("R|")) {
          const parts = line.split("|");

          if (parts.length > 3) {
            const testIdField = parts[2];
            const result = parts[3].replace(",", "."); // Replace comma with dot for decimal

            const cleanTestId = testIdField
              .replace(/\^\^\^/, "")
              .replace(/\^.*$/, "");

            output.results[cleanTestId] = result;
          }
        }
      }

      return output;
  } catch (error) {
    console.error("Error parsing ASTM file:", error);
    throw error;
  }
}

module.exports = {
  parseAstmFile,
};
