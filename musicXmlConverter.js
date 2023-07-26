var childProcess = require('child_process');

// Example: toMp3("/Applications/MuseScore\ 3.app/Contents/MacOS/mscore", "./XML_OUTPUT/test - Glockenspiel.xml");
function toMp3(pathToMScore, filepath) {
    const filepathSplit = filepath.split("/");
    const filename = filepathSplit[filepathSplit.length - 1].split(".")[0];
    const filenameWithoutInstrument = filename.split(" - ")[0];
    const outputFolder = "./AUDIO_OUTPUT/" + filenameWithoutInstrument;
    const outputLocation = outputFolder + "/" + filename + ".mp3"
    childProcess.execSync('"' + pathToMScore + '" -o "' + outputLocation + '" "' + filepath + '"', { encoding: 'utf-8', stdio : 'pipe' });
}

module.exports = {
    xmlToMp3: function (pathToMScore, filepath) {
        toMp3(pathToMScore, filepath);
    },
};