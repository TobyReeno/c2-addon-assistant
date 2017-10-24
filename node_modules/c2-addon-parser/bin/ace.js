#! /usr/bin/env node

var c2PluginAceTable = require('../lib/index');
var args             = require('yargs').argv;
var fs               = require('fs');
var path             = require('path');

if (args.d && args.e) {
    var ace = c2PluginAceTable.export(args.d, args.e);
    if (args.d === 'json') {
        console.log(JSON.stringify(ace, null, '\t'));
    } else if (args.o) {
        fs.writeFileSync(path.join(args.d, args.o), ace, 'utf8');
    } else {
        console.log(ace);
    }
} else if (args.d && args.t) {
    var type = c2PluginAceTable.getType(args.d);
    console.log(type);
} else {
    console.log("Missing plugin folder or export type");
}
