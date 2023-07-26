const fs = require('fs');
const xmlJs = require('xml-js');

// TODO: copy over metadata like the DOCTYPE tag
// it doesnt seem necessary at the momment, but it may cause problems in the future

// Example: splitParts("/XML_OUTPUT/test.xml");
function splitParts(filepath) {
    const filepathSplit = filepath.split('/');
    const filename = filepathSplit[filepathSplit.length - 1].split('.')[0];

    // Read the MusicXML file
    const OUTPUT_FOLDER = './XML_OUTPUT';
    const xml = fs.readFileSync(filepath, 'utf-8');

    // Parse the MusicXML file
    const options = {
        compact: false,
        ignoreDeclaration: true,
        ignoreInstruction: true,
        ignoreComment: true,
        ignoreDoctype: true,
        spaces: 2,
    };
    const fullXml = xmlJs.xml2js(xml, options);

    // Get the parts from the MusicXML file
    const parts = fullXml.elements[0].elements.filter((element) => element.name === 'part').map(obj => obj.attributes.id);
    // Loop through each part and save it as a new MusicXML file
    for (let i = 0; i < parts.length; i++) {
        var id = parts[i];

        // clone full xml
        const editedXml = structuredClone(fullXml);

        // grab the partlist
        var partList = editedXml.elements[0].elements.find((element) => element.name === 'part-list');
        // filter out everything but the current part based on the id we are looking at
        partList.elements = partList.elements.filter(obj => obj.attributes.id === id);

        // clear out part info
        editedXml.elements[0].elements = editedXml.elements[0].elements.filter((element) => element.name !== 'part');

        // fill in only the part that corresponds to the part id we are looking at
        var part = fullXml.elements[0].elements.filter((element) => element.name === 'part').filter((element) => element.attributes.id === id)[0];
        editedXml.elements[0].elements.push(part);

        // check if the part is empty
        var partIsEmpty = true;
        var measures = part.elements.filter((element) => element.name === 'measure');
        for (let j = 0; j < measures.length; j++) {
            var notes = measures[j].elements.filter((element) => element.name === 'note' && element.elements.filter((subelement) => subelement.name === 'rest').length <= 0);
            if (notes.length > 0) {
                partIsEmpty = false;
                break;
            }
        }

        // if it is empty, skip it
        if (partIsEmpty) {
            continue;
        }

        // get the name of the instrument
        const partName = editedXml.elements[0].elements.filter((element) => element.name === 'part-list')[0].elements[0].elements.filter((element) => element.name === 'part-name')[0].elements[0].text;

        const partXMLString = xmlJs.js2xml(editedXml, { spaces: 2 });
        if (partName === undefined) {
            console.log(
                "A part for the song '" +
                filename +
                "' is not named in the score. All parts must have their name. Skipping part."
            );
        } else {
            // Save the part as a new MusicXML file
            const outputFilename = OUTPUT_FOLDER + '/' + filename + '/' + filename + ' - ' + partName + '.xml';
            fs.writeFileSync(outputFilename, partXMLString, 'utf-8');
        }
    }
}

// Example: split("/XML_OUTPUT/test.xml");
function setFlatTempo(filepath, tempo) {
    console.log(filepath);
    const xml = fs.readFileSync(filepath, 'utf-8');

    // Parse the MusicXML file
    const options = {
        compact: false,
        ignoreDeclaration: true,
        ignoreInstruction: true,
        ignoreComment: true,
        ignoreDoctype: true,
        spaces: 2
    };
    const fullXml = xmlJs.xml2js(xml, options);

    // Get the parts from the MusicXML file
    const parts = fullXml.elements[0].elements.filter((element) => element.name === 'part');

    const tempoMarkerElement = {
        type: 'element',
        name: 'sound',
        attributes: { tempo: (tempo == undefined? "120": tempo) },
        elements: 
            [
                {
                    type: 'element',
                    name: 'swing',
                    elements: [
                        {
                            type: 'element',
                            name: 'straight',
                            elements: []
                        }
                    ]
                }
            ]
    };

    // filter out everything but the current part based on the id we are looking at
    parts.forEach(
        (part) => {
            var measures = part.elements.filter((element) => element.name === 'measure');
            measures.forEach(
                (measure) => {
                    measure.elements = measure.elements.filter(
                        (element) => element.name !== 'sound' || element.attributes === undefined || element.attributes.tempo === undefined
                    );
                    if (measure.attributes.number === "1") {
                        measure.elements.unshift(tempoMarkerElement);
                    }
                }
            );
        }
    );

    const partXMLString = xmlJs.js2xml(fullXml, { spaces: 2 });

    // Save the part as a new MusicXML file
    fs.writeFileSync(filepath, partXMLString, 'utf-8');
}

module.exports = {
    splitParts: function (filepath) {
        splitParts(filepath);
    },
    setFlatTempo: function (filepath) {
        setFlatTempo(filepath);
    },
};