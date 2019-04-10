#!/usr/bin/env node
const program = require('commander');

program
  .action(() => {
    require('../lib/index')();
  });

program.parse(process.argv);
