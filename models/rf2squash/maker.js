
const xml2js = require('xml2js')
const fsp = require('fs').promises;

function setUpToSquashFromXmlFile(sourceFilePath, cibleMappingFilePath, cibleStatusTestsFilePath) {
    fsp.readFile(sourceFilePath).then(xml => {
        xml2js.parseString(xml, (err, result) => {
            if (err) {
                throw err;
            }
            let shortResult = [];
            result = result.robot.suite[0].suite;
            result.forEach(el => {
                el.suite.forEach(els => {
                    shortResult.push({ fileName: els.$.name, tests: els.test });
                });
            });

            let finalResult = [];
            let mappings = {};

            let nbSucess = 0;
            shortResult.forEach(el => {
                let test = {};
                mappings[el.fileName] = [];

                let isFail = false;
                el.tests.forEach(els => {

                    if (Array.isArray(els.kw)) {
                        els.kw.forEach(elss => {
                            let status = elss.status[0].$.status;
                            if (status == "FAIL") {
                                console.log(el.fileName + " : KO");
                                isFail = true;
                                test["name"] = el.fileName;
                                test["status"] = "KO";
                            }
                        });
                    } /*else {
                        console.log("Other :");
                        console.log(els);
                    }*/




                    // ! cas de la loop
                });

                if (!isFail) {
                    test["name"] = el.fileName;
                    test["status"] = "OK";
                    nbSucess++;
                }
                finalResult.push(test);
            });

            const json = JSON.stringify(finalResult, null, 4);

            const json2 = JSON.stringify(mappings, null, 4);

            // log JSON string
            fsp.writeFile(cibleStatusTestsFilePath, json).then(() => console.log(nbSucess + "/" + shortResult.length + " success"));

            fsp.writeFile(cibleMappingFilePath, json2).then(() => console.log("mapping set up"));
        });
    });
}


module.exports = { setUpToSquashFromXmlFile }