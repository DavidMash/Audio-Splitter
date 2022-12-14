import childProcess from 'child_process';
import fs from 'fs';

const instrumentMatchers = [
    {
        pattern: (new RegExp(".*Full.*")),
        instrument: "Full"
    },
    {
        pattern: (new RegExp(".*Vocal.*")),
        instrument: "Vocal 1"
    },
    {
        pattern: (new RegExp(".*Vocal.*")),
        instrument: "Vocal 2"
    },
    {
        pattern: (new RegExp(".*Alto[ ]Sax.*")),
        instrument: "Alto Sax"
    },
    {
        pattern: (new RegExp(".*Tenor[ ]Sax.*")),
        instrument: "Tenor Sax"
    },
    {
        pattern: (new RegExp(".*Baritone[ ]Sax.*")),
        instrument: "Baritone Sax"
    },
    {
        pattern: (new RegExp(".*Trumpet.*")),
        instrument: "Trumpet"
    },
    {
        pattern: (new RegExp(".*Trombone.*")),
        instrument: "Trombone"
    },
    {
        pattern: (new RegExp(".*Violin.*")),
        instrument: "Violin"
    },
    {
        pattern: (new RegExp(".*Cello.*")),
        instrument: "Cello"
    },
    {
        pattern: (new RegExp(".*Guitar.*")),
        instrument: "Electric Guitar"
    },
    {
        pattern: (new RegExp(".*Electric[ ]Bass.*")),
        instrument: "Electric Bass"
    },
    {
        pattern: (new RegExp(".*Drum[ ]Set.*")),
        instrument: "Drum Set"
    },
    {
        pattern: (new RegExp(".*Cymbals|Shakers|Tambourine|Percussion|Conga|Bongo|Cowbell.*")),
        instrument: "Percussion"
    },
    {
        pattern: (new RegExp(".*Synth.*")),
        instrument: "Synth 1"
    },
    {
        pattern: (new RegExp(".*Synth.*")),
        instrument: "Synth 2"
    },
];

var lsResult = childProcess.execSync('cd WORKSPACE; ls', { encoding: 'utf-8', stdio : 'pipe' });  // the default is 'buffer'
var allSongs = lsResult.split('\n');
var currentSong;
var allFiles;

// set up matchers for each instrument
for (let i = 0; i < instrumentMatchers.length; i++) {
    const matcher = instrumentMatchers[i];
    matcher.songsMatched = [];
    matcher.scoresMatched = [];
}

var songDurations = {};

// processs audio files
for (let i = 0; i < allSongs.length; i++) {
    var currentSong = allSongs[i];
    if (currentSong == ''){
        break
    }
    console.log("Working on '" + currentSong + "' audio:");
    songDurations[currentSong] = {};
    var lsResult = childProcess.execSync('cd WORKSPACE; cd "' + currentSong + '"; cd audio_files; ls', { encoding: 'utf-8', stdio : 'pipe' });  // the default is 'buffer'
    var allFiles = lsResult.split('\n');
    var baseInputFile = 'WORKSPACE/' + currentSong + '/audio_files';
    for (let j = 0; j < allFiles.length; j++){
        var currentFile = allFiles[j];
        var split = currentFile.split(".");
        if (split.length <= 1) {
            continue;
        }
        var ext = split[1];
        if (ext == "mp3") {
            let instrument = undefined;
            for (let k = 0; k < instrumentMatchers.length; k++) {
                const matcher = instrumentMatchers[k];
                if (!matcher.songsMatched.includes(i)) {
                    const regex = matcher.pattern;
                    if (currentFile.match(regex)) {
                        matcher.songsMatched.push(i);
                        instrument = matcher.instrument;
                        break;
                    }
                }
            }
            if (instrument == undefined) {
                //console.log('\t"' + currentFile + '" did not match to any instrument regex.')
                continue;
            }
            console.log("\tWorking on '" + instrument + "' audio.");
            const outputFolder = './AUDIO_OUTPUT/' + currentSong;
            try {
                childProcess.execSync('mkdir "' + outputFolder + '"', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (e) {
            }
            try {
                var inputFile = baseInputFile + '/' + currentFile;
                //record song durations
                const metadata = JSON.parse(childProcess.execSync('ffprobe -v quiet -print_format json -show_format -show_streams "' + inputFile + '"', { encoding: 'utf-8', stdio : 'pipe' }));
                const duration = metadata.streams[0].duration
                console.log("\t\tThe duration is: " + duration + "s");
                songDurations[currentSong][instrument] = duration;
                //break each song into 16 seconds chunks (except the full recordings)
                if (instrument != "Full") {
                    childProcess.execSync('ffmpeg -hide_banner -y -i "' + inputFile + '" -f segment -segment_time ' + 16 + ' -c copy "' + outputFolder + '/' + currentSong + ' - ' + instrument + '":%01d.wav', { encoding: 'utf-8', stdio : 'pipe' });
                }
                //copy them over to the right place
                childProcess.execSync('cp "' + inputFile + '" "' + outputFolder + '/' + currentSong + ' - ' + instrument + '.mp3"', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (error) {
                console.error(error.message);
            }
        }
    }
}

//save the song durations
var strData = JSON.stringify(songDurations);
fs.writeFile('AUDIO_OUTPUT/durations.json', strData, function(err) {
    if(err) {
        console.log(err);
    } else {
        console.log("Metadata was saved!");
    }
});

// process pdf files
for (let i = 0; i < allSongs.length; i++) {
    var currentSong = allSongs[i];
    if (currentSong == ''){
        break
    }
    console.log("Working on '" + currentSong + "' pdfs:");
    var lsResult = childProcess.execSync('cd WORKSPACE; cd "' + currentSong + '"; cd halved_parts; ls', { encoding: 'utf-8', stdio : 'pipe' });  // the default is 'buffer'
    var allFiles = lsResult.split('\n');
    var baseInputFile = 'WORKSPACE/' + currentSong + '/halved_parts';
    for (let j = 0; j < allFiles.length; j++){
        var currentFile = allFiles[j];
        var split = currentFile.split(".");
        if (split.length <= 1) {
            continue;
        }
        var ext = split[1];
        if (ext == "pdf") {
            let instrument = undefined;
            for (let k = 0; k < instrumentMatchers.length; k++) {
                const matcher = instrumentMatchers[k];
                if (!matcher.scoresMatched.includes(i)) {
                    const regex = matcher.pattern;
                    if (currentFile.match(regex)) {
                        matcher.scoresMatched.push(i);
                        instrument = matcher.instrument;
                        break;
                    }
                }
            }
            if (instrument == undefined) {
                //console.log('\t"' + currentFile + '" did not match to any instrument regex.')
                continue;
            }
            console.log("\tWorking on '" + instrument + "' pdf.");
            const outputFolder = './SCORE_OUTPUT/' + currentSong;
            try {
                childProcess.execSync('mkdir "' + outputFolder + '"', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (e) {
            }
            try {
                var inputFile = baseInputFile + '/' + currentFile;
                childProcess.execSync('cp "' + inputFile + '" "' + outputFolder + '/' + currentSong + ' - ' + instrument + '.pdf"', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (error) {
                console.error(error.message);
            }
        }
    }
}

lsResult = childProcess.execSync('cd AUDIO_OUTPUT; ls', { encoding: 'utf-8', stdio : 'pipe' });  // the default is 'buffer'
var allSongs = lsResult.split('\n');
var currentSong;
var allFiles;
for (let i = 0; i < allSongs.length; i++) {
    var currentSong = allSongs[i];
    if (currentSong == ''){
        break
    }
    console.log("Working on creating cleaned files for '" + currentSong + "':");
    var lsResult = childProcess.execSync('cd AUDIO_OUTPUT; cd "' + currentSong + '"; ls', { encoding: 'utf-8', stdio : 'pipe' });  // the default is 'buffer'
    var allFiles = lsResult.split('\n');
    for (let j=0; j<allFiles.length; j++ ){
        var currentFile = allFiles[j];
        var split = currentFile.split(".");
        var ext = split[1];
        if (ext == "mp3" & split[0].split('_')[0] != "clean" ) {
            console.log("\tWorking on '" + instrument + "' cleaned file.");
            try {
                var baseInputFile = 'AUDIO_OUTPUT/' + currentSong;
                var inputFile = baseInputFile + '/' + currentFile;
                childProcess.execSync('ffmpeg -hide_banner -y -i "' + inputFile + '" -codec:a libmp3lame -b:a 128k "' + baseInputFile + '/clean_' + currentFile + '" ', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (error) {
                console.error(error.message);
            }
        }
    }
}

//create waveform files
console.log("Creating waveform json files.");
for (let i = 0; i < allSongs.length; i++) {
    currentSong = allSongs[i];
    if (currentSong == ''){
        break
    }
    console.log("Working on creating waveform json files for '" + currentSong + "':");
    var lsResult = childProcess.execSync('cd AUDIO_OUTPUT; cd "' + currentSong + '"; ls', { encoding: 'utf-8', stdio : 'pipe' });
    allFiles = lsResult.split('\n');
    for (let j=0; j<allFiles.length; j++ ){
        var currentFile = allFiles[j];
        var split = currentFile.split(".");
        var ext = split[1];
        if (ext == "mp3" & split[0].split('_')[0]== "clean" ) {
            console.log("\tWorking on '" + instrument + "' waveform.");
            try {
                var baseInputFile = 'AUDIO_OUTPUT/' + currentSong;
                var inputFile = baseInputFile + '/' + currentFile;
                var baseOutputFolder = 'WAVEFORM_OUTPUT/' + currentSong;
                var outputFile = baseOutputFolder + '/' + split[0].split('_')[1];
                childProcess.execSync('mkdir -p "' + baseOutputFolder + '"', { encoding: 'utf-8', stdio : 'pipe' });
                childProcess.execSync('audiowaveform -i "' + inputFile + '" -o "' + outputFile + '.json" --amplitude-scale 0 -b 8 -z 12800 -q ', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (error) {
                console.error(error.message);
            }
        }
    }
}

// normalize!
console.log("Normalizing waveforms.");
for (let i = 0; i < allSongs.length; i++) {
    currentSong = allSongs[i];
    if (currentSong == ''){
        break
    }
    console.log("Working on normalizing the waveform json files for '" + currentSong + "':");
    lsResult = childProcess.execSync('cd WAVEFORM_OUTPUT; cd "' + currentSong + '"; ls', { encoding: 'utf-8', stdio : 'pipe' }); 
    allFiles = lsResult.split('\n');
    for (let j=0; j<allFiles.length; j++ ){
        var currentFile = allFiles[j];
        var split = currentFile.split(".");
        var ext = split[1];
        if (ext == "json") {
            console.log("\tWorking on '" + instrument + "' waveform normalization.");
            (function (filename) {
                //console.log(filename);
                fs.readFile(filename, (err, data) => {
                    if (err) throw err;
                    const json = JSON.parse(data);
                    const waves = json.data;
                    const min = Math.min(...waves.map((n) => {return Math.abs(n);}));
                    let normalizedWaves = waves.map(
                        (n) => {
                            if (n < 0) {
                                return (n + min);
                            } else {
                                return (n - min);
                            }
                        }
                    );
                    const max = Math.max(...normalizedWaves);
                    if (max > 0) normalizedWaves = normalizedWaves.map(
                        (n) => {
                            return (n / max);
                        }
                    )
                    json.data = normalizedWaves;
                    var str = JSON.stringify(json);
                    fs.writeFile(filename, str, function(err) {
                        if(err) {
                            console.log(err);
                        }
                    });
                });
            }('./WAVEFORM_OUTPUT/'+currentSong+'/'+currentFile));
        }
    }
}

// clean up!
console.log("Cleaning up...");
for (let i = 0; i < allSongs.length; i++) {
    currentSong = allSongs[i];
    if (currentSong == ''){
        break
    }
    var lsResult = childProcess.execSync('cd AUDIO_OUTPUT; cd "' + currentSong + '"; ls', { encoding: 'utf-8', stdio : 'pipe' });
    allFiles = lsResult.split('\n');
    for (let j=0; j<allFiles.length; j++ ){
        var currentFile = allFiles[j];
        var split = currentFile.split(".");
        var ext = split[1];
        if (ext == "mp3" & split[0].split('_')[0]== "clean" ) {
            try {
                var baseInputFile = 'AUDIO_OUTPUT/' + currentSong;
                var file = baseInputFile + '/' + currentFile;
                childProcess.execSync('rm "' + file + '"', { encoding: 'utf-8', stdio : 'pipe' });
            } catch (error) {
                console.error(error.message);
            }
        }
    }
}
console.log("Done!");