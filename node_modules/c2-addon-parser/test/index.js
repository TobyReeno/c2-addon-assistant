'use strict';

var assert           = require('assert');
var c2PluginAceTable = require('../lib');
var fs               = require("fs");

describe('ace json export', function () {
	it('should return true', function () {
		var ace = c2PluginAceTable.export("./browser_module", {type: "json"});
		assert(ace, 'We expect this to return true');
	});
});
