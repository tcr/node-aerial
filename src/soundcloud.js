var http = require('http')
var fs = require('fs')
var StreamSnitch = require('stream-snitch')
var streamify = require('streamify');
var rem = require('rem');

var env = require('../env');

var baseUrl    = 'https://soundcloud.com/'

function scrape (artist, title, next) {
  console.log(baseUrl + artist + '/' + title)
  var res = rem.stream(baseUrl + artist + '/' + title).get();
  var snitch = new StreamSnitch(/api\.soundcloud\.com\/tracks\/(\d+)/g);
  var downloaded = false;
  snitch.once('match', function (match) {
  	downloaded = true;
    download(match[1], next)
  });

  res.pipe(snitch);
  res.on('end', function () {
  	if (!downloaded) {
  		next(new Error('Track not found.'));
  	}
  });

  res.on('error', netErr);
}

function download (obj, next) {
  rem.json('https://api.soundcloud.com/i1/tracks/' + obj + '/streams', {
    client_id: 'b45b1aa10f1ac2941910a7f0d10f8e28',
    app_version: '2b873c3'
  }).get(function (err, json) {
    next(err, !err && rem.stream(json.http_mp3_128_url).get(), 30); //obj.duration);
  })
}

function netErr (err) {
	console.error(err);
}

function getStream (id) {
  var stream = streamify();

  if (id.indexOf('/') > -1) {
    process.nextTick(function () {
      stream.emit('uri', 'https://soundcloud.com/' + id);

      scrape(id.split('/')[0], id.split('/')[1], onscrape);
    });
  }
  else {
    rem.json('https://api.soundcloud.com/tracks/', id, {
      client_id: env.SOUNDCLOUD_KEY,
      format: 'json'
    }).get(function (err, json) {
      console.log(json)
      stream.emit('uri', 'http://soundcloud.com/' + json.user.permalink + '/' + json.permalink);

      scrape(json.user.permalink, json.permalink, onscrape);
    })
  }

  function onscrape (err, song, duration) {
    if (err) throw err;
    stream.resolve(song);

    stream.emit('duration', duration);
  }

  return stream;
}

module.exports = getStream;

if (require.main === module) {
  getStream(process.argv[2]).pipe(process.stdout);
}
