var cp = require('child_process');

var services = ['soundcloud', 'youtube', 'spotify'];

exports.stream = function (service, id) {
  if (id == null && service.indexOf(':') > -1) {
    id = service.replace(/^.*?:/, '');
    service = service.split(':')[0];
  }

  if (services.indexOf(service) == -1) {
    console.error(service, 'is not a known stream source.');
    process.exit(1);
  }

  var proc = cp.fork(__dirname + '/src/' + service, [id], {
    silent: true,
  });
  proc.stderr.pipe(process.stderr);
  proc.on('exit', function (err) {
    if (err != 0) {
      console.error(service, 'closed unexpectedly.');
    }
  })
  return proc.stdout;
};

exports.playlist = function (id, next) {
  require('./src/spotify-playlist').fetch(id, next);
};
