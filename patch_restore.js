const fs = require('fs');
const { parser } = require('stream-json');
const { pick } = require('stream-json/filters/Pick');
const { streamValues } = require('stream-json/streamers/StreamValues');

async function extractValue(filePath, filterName) {
    return new Promise((resolve, reject) => {
        let result = null;
        const stream = fs.createReadStream(filePath)
            .pipe(parser())
            .pipe(pick({ filter: filterName }))
            .pipe(streamValues());

        stream.on('data', ({ value }) => {
            result = value;
        });
        stream.on('end', () => resolve(result));
        stream.on('error', () => resolve(null));
    });
}

extractValue('test_data.json', 'version').then(console.log);
