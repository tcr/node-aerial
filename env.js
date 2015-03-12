var ini = require('ini');
var fs = require('fs');
var osenv = require('osenv');
var objectAssign = require('object-assign');

var env;
try {
  env = ini.parse(fs.readFileSync(osenv.home() + '/.aerial', 'utf-8'));
} catch (e) {
  env = {};
}

module.exports = objectAssign({}, process.env, env);
