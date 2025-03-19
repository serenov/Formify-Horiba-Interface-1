const fs = require("fs");
const { promisify } = require("util");

const readFileAsync = promisify(fs.readFile);

async function parseAstmFile(filePath) {
  try {
    const data = await readFileAsync(filePath, "utf8");
    const lines = data.split("\n").filter((line) => line.trim());

    // Check if this is a valid ASTM file
    if (lines.length === 0 || !lines[0].startsWith("H|")) {
      throw new Error("Invalid ASTM file format");
    }

    // Basic ASTM parsing
    const header = parseAstmLine(lines[0], "H");
    const patients = [];
    const orders = [];
    const results = [];

    let currentPatient = null;
    let currentOrder = null;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith("P|")) {
        currentPatient = parseAstmLine(line, "P");
        patients.push(currentPatient);
      } else if (line.startsWith("O|")) {
        currentOrder = parseAstmLine(line, "O");
        currentOrder.patientId = currentPatient ? currentPatient.id : null;
        orders.push(currentOrder);
      } else if (line.startsWith("R|")) {
        const result = parseAstmLine(line, "R");
        result.orderId = currentOrder ? currentOrder.id : null;
        results.push(result);
      }
    }

    return {
      header,
      patients,
      orders,
      results,
    };
  } catch (error) {
    console.error("Error parsing ASTM file:", error);
    throw error;
  }
}

function parseAstmLine(line, recordType) {
  const fields = line.split("|");

  if (recordType === "H") {
    return {
      type: "header",
      senderId: fields[1] || "",
      receiverId: fields[2] || "",
      processingId: fields[3] || "",
      versionNumber: fields[4] || "",
    };
  } else if (recordType === "P") {
    return {
      type: "patient",
      id: fields[2] || "",
      name: fields[3] || "",
      dateOfBirth: fields[4] || "",
      sex: fields[5] || "",
      address: fields[6] || "",
      other: fields.slice(7).join("|"),
    };
  } else if (recordType === "O") {
    return {
      type: "order",
      id: fields[2] || "",
      specimenId: fields[3] || "",
      instrumentId: fields[4] || "",
      universalTestId: fields[5] || "",
      priority: fields[6] || "",
      requestedDateTime: fields[7] || "",
      other: fields.slice(8).join("|"),
    };
  } else if (recordType === "R") {
    return {
      type: "result",
      sequenceNumber: fields[1] || "",
      universalTestId: fields[2] || "",
      value: fields[3] || "",
      units: fields[4] || "",
      referenceRanges: fields[5] || "",
      resultStatus: fields[6] || "",
      other: fields.slice(7).join("|"),
    };
  }

  return { type: "unknown", rawData: line };
}

module.exports = {
  parseAstmFile,
};
