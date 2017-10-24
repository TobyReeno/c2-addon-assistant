#!/usr/bin/env node
'use strict';

const core = require('./../lib/core');
const program = require('commander');
const config = require('./../lib/config');

program
    .version('0.5.0')
    .description('Construct addon development assistant');

program
    .command('init <addon_type>')
    .description('Initialize the addon workspace')
    .action(core.init);

program
    .command('update')
    .description('Copy working version to C2. Create/update beta *.c2addon and *.c3addon. Create/update ACE.md.')
    .action(core.update);

program
    .command('release')
    .description('Save current beta addons as version-marked addons and creates release zip file.')
    .action(core.release);

program
    .command('config')
    .description('Starts config prompt')
    .action(config.startPrompt);

program
    .command('set-version [version]')
    .description('Sets the version in info.xml and edittime.js')
    .action(core.setVersion);

program.parse(process.argv);

