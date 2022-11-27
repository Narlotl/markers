const fs = require('fs');

fs.readdir('data', (err, files) => {
    if (err)
        throw err;
    else
        for (const file of files)
            fs.readFile('data/' + file + '/' + file.toLowerCase() + '.txt', (err, data) => {
                const markers = [];
                if (err)
                    throw err;
                else {
                    data = data.toString().split(/\*{10,}\n/gm).slice(1);
                    let region, date;
                    for (let i = 0; i < data.length; i++) {
                        let descStarted = false;
                        const id = data[i].match(/[A-Z]+[0-9]+/)[0];
                        let lat, long, setting, description;
                        data[i] = data[i].replaceAll(id + '\'', '').replaceAll(id, '').split('\n');
                        for (const line of data[i]) {
                            if (line.includes('Retrieval Date')) {
                                descStarted = false;
                                date = line.substring(line.indexOf('=') + 2, line.length);
                            }
                            if (descStarted)
                                description += line;
                            else
                                if (line.includes('*') && line.includes('POSITION')) {
                                    let temp = line.slice(line.indexOf('POSITION-') + 10).replaceAll(/ {2,}/g, ' ').replaceAll('. ', '.0');
                                    temp = temp.substring(0, temp.lastIndexOf(')')).replaceAll(/\(|\)/g, '');
                                    lat = temp.match(/([0-9]|\.| )+(N|S)/)[0];
                                    long = temp.substring(lat.length + 1, temp.length);
                                }
                                else if (line.includes('_SETTING'))
                                    setting = line.substring(line.indexOf('= ') + 2, line.length)
                                else if (line.includes('STATION DESCRIPTION'))
                                    descStarted = true;
                                else if (line.includes('STATE/COUNTY-'))
                                    region = line.substring(line.indexOf('-') + 3, line.length);
                        } try {
                            lat = lat.split(' ');
                            lat = (parseInt(lat[0]) + (parseInt(lat[1]) / 60) + parseFloat(lat[2].slice(0, -1)) / 3600) * (lat[2].includes('S') ? -1 : 1);
                            long = long.split(' ');
                            long = (parseInt(long[0]) + (parseInt(long[1]) / 60) + parseFloat(long[2].slice(0, -1)) / 3600) * (long[2].includes('W') ? -1 : 1);
                            description = description.slice(11)
                            markers.push({ id, lat, long, setting, description });
                        } catch (e) { console.error('Parsing failed for ' + file + '[' + i + ']', e) }
                    }
                    fs.writeFile('output/' + file.toLowerCase() + '.json', JSON.stringify({ date, region, markers }), (err) => { if (err) throw err; });
                }
            });
});