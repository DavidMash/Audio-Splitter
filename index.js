import childProcess from 'child_process';

const lsResult = childProcess.execSync('ls', { encoding: 'utf-8' });  // the default is 'buffer'
const allFiles = lsResult.split('\n');
console.log("STARTING");

for (let i = 0; i < allFiles.length; i++) {
    const split = allFiles[i].split(".");
    const ext = split[1];
    if (ext == "mp3") {
        console.log(allFiles[i]);
        try {
            const fileNameWithSlashes = allFiles[i].replaceAll(" ","\\ ");
            const fileNoExt = fileNameWithSlashes.split('.')[0];
            childProcess.execSync("ffmpeg -i " + fileNameWithSlashes + " -f segment -segment_time " + 16 + " -c copy " + fileNoExt + ":%01d.wav", { encoding: 'utf-8' });
        } catch (error) {
            console.error(error.message);
        }
    }
        
}