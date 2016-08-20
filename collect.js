/* eslint no-var: 0, brace-style: 0 */

const fs = require('fs');
const path = require('path');
const flowBin = require('flow-bin');
const Q = require('q');
const childProcess = require('child_process');

/**
 * Flow check initialises a server per folder when run,
 * we can store these paths and kill them later if need be.
 */
const servers = [];
let passed = true;

/**
 * Wrap critical Flow exception into default Error json format
 */
function fatalError(stderr) {
  return {
    errors: [{
      message: [{
        path: '',
        code: 0,
        line: 0,
        start: 0,
        descr: stderr
      }]
    }]
  };
}

function optsToArgs(opts) {
  const args = [];

  if (opts.all) {
    args.push('--all');
  }
  if (opts.weak) {
    args.push('--weak');
  }
  if (opts.declarations) {
    args.push('--lib', opts.declarations);
  }

  return args;
}

function getFlowBin() {
  return process.env.FLOW_BIN || flowBin;
}

function executeFlow(_path, options) {
  var deferred = Q.defer();

  var opts = optsToArgs(options);

  var command = opts.length || options.killFlow ? (() => {
    servers.push(path.dirname(_path));
    return 'check';
  })() : 'status';

  var args = [
    command,
    ...opts,
    '/' + path.relative('/', _path),
    '--json'
  ];

  var stream = childProcess.spawn(getFlowBin(), args);

  var dat = '';
  stream.stdout.on('data', data => {
    dat += data.toString();
  });

  stream.stdout.on('end', () => {
    var parsed;
    try {
      parsed = JSON.parse(dat);
    } catch (e) {
      parsed = fatalError(dat);
    }
    const result = {};

    // loop through errors in file
    result.errors = parsed.errors.filter(error => {
      // TEMP
      return true;
      // const isCurrentFile = error.message[0].path === _path;
      // const generalError = (/(Fatal)/.test(error.message[0].descr));
      //
      // return isCurrentFile || generalError;
    })
    .map(res => res.message.map(_res => {
      if (!_res.loc) return false;

      return {
        message: _res.descr,
        path: _res.path,
        start: _res.loc.start.line,
        end: _res.loc.end.line
      };
    }))
    .reduce((p, c) => p.concat(c), []);

    if (result.errors.length) {
      passed = false;
      console.log('FAILED');
      deferred.reject(result.errors);
    }
    else {
      console.log('PASSED');
      deferred.resolve();
    }
  });

  return deferred.promise;
}

function checkFlowConfigExist() {
  var deferred = Q.defer();
  var config = path.join(process.cwd(), '.flowconfig');
  fs.exists(config, exists => {
    if (exists) {
      deferred.resolve();
    }
    else {
      deferred.reject('Missing .flowconfig in the current working directory.');
    }
  });
  return deferred.promise;
}

function hasFlowPragma(contents) {
  return /@flow\b/ig
    .test(contents);
}

function isFileSuitable(file) {
  var deferred = Q.defer();

  // TEMP
  deferred.resolve(true);

  // if (file.isNull()) {
  //   deferred.reject();
  // }
  // else if (file.isStream()) {
  //   deferred.reject(new Error('gulp-flow', 'Stream content is not supported'));
  // }
  // else if (file.isBuffer()) {
  //   deferred.resolve();
  // }
  // else {
  //   deferred.reject();
  // }
  return deferred.promise;
}

function killServers() {
  const defers = servers.map(function(_path) {
    const deferred = Q.defer();
    childProcess.execFile(getFlowBin(), ['stop'], {
      cwd: _path
    }, deferred.resolve);
    return deferred;
  });
  return Q.all(defers);
}

// module.exports = function (options={}) {
const options = {};

options.beep = typeof options.beep !== 'undefined' ? options.beep : true;

function Flow(file = './', enc, callback) {
  return checkFlowConfigExist().then(() => executeFlow(file, {}));

  // checkFlowConfigExist().then(() => {
  //   executeFlow(file, {}).then(res => {
  //     // console.log(res);
  //   }, err => {
  //     console.log('error', err);
  //     callback();
  //   }, err => {
  //     console.log(err);
  //   });
  // }, msg => {
  //   console.log(msg);
  //   // _continue();
  // });

  // isFileSuitable(file).then(() => {
  //   const hasPragma = hasFlowPragma(file.contents.toString());
  //   console.log('some...........');
  //   console.log(hasPragma);
  //   if (options.all || hasPragma) {
  //     checkFlowConfigExist().then(() => {
  //       executeFlow(file.path, options).then(() => {}, err => {
  //         console.log('error', err);
  //         callback();
  //       });
  //     }, msg => {
  //       console.log(msg);
  //       // _continue();
  //     });
  //   } else {
  //     // _continue();
  //   }
  // }, err => {
  //   if (err) {
  //     console.log('error', err);
  //   }
  //   callback();
  // });
}

module.exports = Flow;
// Flow();

// };
