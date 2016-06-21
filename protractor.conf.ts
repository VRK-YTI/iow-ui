/// <reference path="./type-context/protractor.d.ts" />

import * as path from 'path';

function root(...globs: string[]) {
  return path.join.apply(path, [__dirname].concat(globs));
}

exports.config = {
  baseUrl: 'http://localhost:9001/',

  specs: [
    root('src/**/**.e2e.ts'),
    root('src/**/*.e2e.ts')
  ],
  exclude: [],

  framework: 'jasmine2',

  allScriptsTimeout: 110000,

  jasmineNodeOpts: {
    showTiming: true,
    showColors: true,
    isVerbose: false,
    includeStackTrace: false,
    defaultTimeoutInterval: 400000
  },
  directConnect: true,

  capabilities: {
    'browserName': 'chrome',
    'chromeOptions': {
      'args': ['show-fps-counter=true']
    }
  },

  onPrepare: function() {
    browser.ignoreSynchronization = true;
  }
};