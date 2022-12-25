const fs = require('fs'), unzipper = require('unzipper');

fs.readdir('data', (err, files) => {
    const size = 3922792169;
    filesDone = 0, bytesDone = 0, start = new Date().getTime();
    if (err)
        throw err;
    else
        for (const file of files)
            /* if (file.includes('ZIP'))
                 fs.unlink('data/' + file, () => { })
     fs.createReadStream('data/' + file).pipe(unzipper.Parse()).on('entry', entry => {
         if (entry.path.includes('txt'))
             entry.pipe(fs.createWriteStream('data/' + entry.path.substring(0, 2) + '.txt'));
     });*/
            fs.readFile('data/' + file, (err, data) => {
                const markers = [];
                if (err)
                    throw err;
                else {
                    bytesDone += data.byteLength;
                    data = data.toString().split(/\*{10,}\n/gm).slice(1);
                    let region, date;
                    for (let i = 0; i < data.length; i++) {
                        let descStarted = false;
                        const id = data[i].match(/[A-Z]+[0-9]+/)[0];
                        let history = [];
                        let lat, long, setting, elevation, type, stability, description, marker, magnetic;
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
                                else if (line.includes('ORTHO HEIGHT'))
                                    elevation = parseFloat(line.substring(line.indexOf('ORTHO HEIGHT -') + 14, line.indexOf('(')));
                                else if (line.includes('MARKER'))
                                    type = line.substring(line.indexOf('= ') + 2);
                                else if (line.includes('STABILITY'))
                                    if (line.includes('='))
                                        stability = line.substring(line.indexOf('= ') + 2);
                                    else
                                        stability += line.substring(line.indexOf(':') + 2);
                                else if (line.includes('HISTORY')) {
                                    const split = line.substring(line.indexOf('-') + 2).split(/ +/);
                                    history.push({ date: split[0], condition: split[1], reporter: split[2] });
                                }
                                else if (line.match(/(\+|_)SETTING/g))
                                    setting += line.substring(line.indexOf('= ') + 2, line.length)
                                else if (line.match(/(\+|_)MARKER/g))
                                    marker += line.substring(line.indexOf('= ') + 2, line.length)
                                else if (line.match(/(\+|_)MAGNETIC/g))
                                    magnetic = line.substring(line.indexOf('= ') + 2, line.length)
                                else if (line.includes('STATION DESCRIPTION'))
                                    descStarted = true;
                                else if (line.includes('STATE/COUNTY-'))
                                    region = line.substring(line.indexOf('-') + 3, line.indexOf('/', line.indexOf('-')));
                        } try {
                            lat = lat.split(' ');
                            lat = (parseInt(lat[0]) + (parseInt(lat[1]) / 60) + parseFloat(lat[2].slice(0, -1)) / 3600) * (lat[2].includes('S') ? -1 : 1);
                            long = long.split(' ');
                            long = -(parseInt(long[0]) + (parseInt(long[1]) / 60) + parseFloat(long[2].slice(0, -1)) / 3600);
                            if (long < -180)
                                long += 360;
                            description = description.slice(11).replace(' *** retrieval complete.', '');
                            markers.push({ description, elevation, history: history.slice(1), id, lat, long, magnetic, marker, setting, stability, type });
                        } catch (e) { console.error('Parsing failed for ' + file + '[' + i + ']', e) }
                    }
                    const limit = Math.ceil(JSON.stringify(markers).length / 15 / 1024 / 1024);
                    for (let i = 0; i < limit; i++)
                        fs.writeFile('output/' + file.substring(0, 2) + (limit > 1 ? i : '') + '.json', JSON.stringify({ date, region, markers: markers.slice(i * markers.length / limit, (i + 1) * markers.length / limit) }), (err) => { if (err) throw err; });
                    filesDone++;
                    console.clear();
                    console.log('Done parsing', file, filesDone + '/' + files.length, Math.round(bytesDone / size * 10000) / 100 + '%');
                }
            });

});