const { parseAstmFile } = require("./src/astm-parser");


(async () => {
    const result = await parseAstmFile('./ftpFiles/sample.astm');

    console.log(result);

})()