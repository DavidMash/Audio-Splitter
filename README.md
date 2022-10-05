# This is a simple script for splitting .mp3 audio files into 16 second .wav chunks using nodejs.
I know. That is strangely specific.
1) You have to install node to run this program.
	- Here is a link to download node: https://nodejs.org/en/download/
2) You must install ffmpeg for the code to work. It is used to deal with the audio files and convert the file types.
	- Here is a link to download ffmpeg: https://ffmpeg.org/download.html
3) Place the .mp3 files you want to work with into the same folder as the index.js file.
3) In a terminal, run "npm start" and the files should be split up into 16 second .wav files each labeled with  a :[section number] to distinguish them from each other