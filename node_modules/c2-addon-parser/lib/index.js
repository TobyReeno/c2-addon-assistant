'use strict';

const fs      = require("fs");
const p       = require("path");
const esprima = require('esprima');
const _       = require("lodash");
var marked    = require('marked');
const process = require('process');

function parse_edittime(path, content) {
	var edittime = {
		config     : [],
		actions    : [],
		conditions : [],
		expressions: [],
		properties : []
	};

	edittime.config["path"]        = path;
	edittime.config["icon_path"]   = p.join(path, "PluginIcon.ico");
	var icon                       = fs.readFileSync(edittime.config["icon_path"]);
	edittime.config["icon_base64"] = icon.toString('base64');

	//Parse file content
	var parsed_edittime = esprima.parse(content);
	//console.log(parsed_edittime.body);

	/**
	 * Getting config
	 */
	var c = parsed_edittime.body[0];
	if (c.type === "FunctionDeclaration") {

		if (c.id.name === "GetPluginSettings")
			edittime.config.addon_type = "Plugin";
		else if (c.id.name === "GetBehaviorSettings")
			edittime.config.addon_type = "Behavior";
		else if (c.id.name === "Effect")
			edittime.config.addon_type = "Effect";
		else
			edittime.config.addon_type = "Unknown";
		
		//Get properties
		var config = c.body.body[0].argument.properties;
		//For each properties, grab each key and value and store it to the json
		_.forEach(config, function (value, index) {
			//console.log(value.key.value + " : " + value.value.value);
			edittime.config[value.key.value] = value.value.value;
		});
	}

	/**
	 * Getting Actions
	 */
	var body                = parsed_edittime.body;
	var needToStartNewArray = true;
	var ACEparameters       = [];
	var comboOptions        = [];
	_.forEach(body, function (value, index) {
		//if value is an expression statement

		if (value.type === "ExpressionStatement") {
			//We can do something
			var expression = value.expression;
			var calleeName = expression.callee.name;

			if (calleeName === "ACESDone")
				return false;
			else if (calleeName === "AddCondition" || calleeName === "AddAction" || calleeName === "AddExpression") {
				var args   = expression.arguments;
				var params = {
					"params": ACEparameters,
					"values": []
				};
				_.forEach(args, function (argument, index) {
					switch (index) {
						case 0: //id
							params.values["id"] = argument.value;
							break;

						case 1: //flags
							params.values["flags"] = argument.value;
							break;

						case 2: //list_name
							params.values["list_name"] = argument.value;
							break;

						case 3: //category
							params.values["category"] = argument.value;
							break;

						case 4: //display_string
							params.values["display_string"] = argument.value;
							break;

						case 5: //description
							params.values["description"] = argument.value;
							break;

						case 6: //script_name
							params.values["script_name"] = argument.value;
							break;

						default:
							break;
					}
				});
				if (calleeName === "AddCondition")
					edittime.conditions.push(params);
				else if (calleeName === "AddAction")
					edittime.actions.push(params);
				else if (calleeName === "AddExpression")
					edittime.expressions.push(params);
				else
					console.log("Unrecognized Add");
				ACEparameters       = [];
				needToStartNewArray = true;
			}
			else {

				needToStartNewArray = false;

				var paramOption = value.expression.callee.name;
				if (paramOption === "AddComboParamOption") {
					comboOptions.push(value.expression["arguments"][0].value);
				}
				else {

					var P = {
						text        : "",
						description : "",
						defaultValue: "",
						options     : comboOptions
					};

					comboOptions = [];

					var Args = value.expression.arguments;

					_.forEach(Args, function (value, index) {
						if (index === 0)
							P.text = value.value;
						else if (index === 1)
							P.description = value.value;
						else
							P.defaultValue = value.value;
					});

					ACEparameters.push(P);
				}
			}
		}
	});

	return edittime;
}

function json_export(path) {
	var edittime = fs.readFileSync(p.join(path, "edittime.js"), "utf8");
	var runtime  = fs.readFileSync(p.join(path, "runtime.js"), "utf8");

	//console.log(parsed);
	return parse_edittime(path, edittime);
}

var Message = function () {
	this.message = [];
	this.add     = function (string, nonewline) {
		if (typeof nonewline === 'undefined')
			nonewline = false;
		this.message.push(string + (nonewline ? "" : "\n"));
	};
	this.get     = function () {
		return this.message.join("");
	};
	this.newline = function () {
		this.message.push("\n");
	}
};

function markdown_export(json) {
	var md = new Message();

	/**
	 * Properties
	 */


	md.add("# Configuration");
	var config = json.config;

	var icon   = " <img src='" + p.relative(process.cwd(), config.icon_path) + "' alt='Icon'>";
	md.add("## " + config.name + " plugin - v" + config.version + " - by " + config.author + icon);
	md.add("Property | Value");
	md.add(":---: | ---");
	md.add("Description | " + config.description);
	md.add("Category | " + config.category);

	var cordovaPlugin = (typeof config["cordova-plugins"] === 'undefined' || config["cordova-plugins"] === "") ? "No" : config["cordova-plugins"];
	md.add("Cordova | " + cordovaPlugin);

	//TODO flags
	var flags = (typeof config.flags === 'undefined' || config.flags === 0) ? "No" : config.flags;
	md.add("Flags | " + flags);
	md.add("Help | " + config["help url"]);
	md.add("Id | " + config.id);

	var rotatable = (config.rotatable) ? "Yes" : "No";
	md.add("Rotatable | " + rotatable);
	md.add("Type | " + config.type);
	md.newline();


	/**
	 * Actions
	 */
	md.add("# Actions");
	var actions = json.actions;

	var plural = (actions.length > 1) ? "are" : "is";
	md.add("#### There " + plural + " " + actions.length + " actions available");

	_.forEach(actions, function (value, index) {
		var values = value.values;
		var params = value.params;

		var deprecated = (values.flags === "af_deprecated") ? "~~" : "";
		md.add(deprecated + "**" + values.category + "::" + values.list_name + "** : " + values.description + deprecated);

		var plural = (params.length > 1) ? "are" : "is";
		if (params.length >= 1) {
			//md.newline();
			//md.add("There " + plural + " " + params.length + " parameters : ");
			//md.newline();
		}

		md.newline();
		_.forEach(params, function (v, i) {
			var defaultValue = (v.defaultValue !== "") ? " (default value : " + v.defaultValue + ")" : "";
			md.add("* **" + v.text + "** : " + v.description + defaultValue);
			if (v.options.length >= 1) {
				_.forEach(v.options, function (value, index) {
					md.add("  * " + value);
				})
			}
		});
		md.newline();
		md.add("---");
		md.newline();
	});

	/**
	 * Conditions
	 */
	md.add("# Conditions");
	var conditions = json.conditions;

	plural = (conditions.length > 1) ? "are" : "is";
	md.add("#### There " + plural + " " + conditions.length + " conditions available");

	_.forEach(conditions, function (value, index) {
		var values = value.values;
		var params = value.params;

		//TODO flags better support
		var deprecated = (values.flags === "af_deprecated") ? "~~" : "";
		md.add(deprecated + "**" + values.category + "::" + values.list_name + "** : " + values.description + deprecated);

		var plural = (params.length > 1) ? "are" : "is";
		if (params.length >= 1) {
			////md.newline();
			////md.add("There " + plural + " " + params.length + " parameters : ");
			////md.newline();
		}
		md.newline();
		_.forEach(params, function (v, i) {
			var defaultValue = (v.defaultValue !== "") ? " (default value : " + v.defaultValue + ")" : "";
			md.add("* **" + v.text + "** : " + v.description + defaultValue);
			if (v.options.length >= 1) {
				_.forEach(v.options, function (value, index) {
					md.add("  * " + value);
				})
			}
		});
		md.newline();
		md.add("---");
		md.newline();
	});

	/**
	 * Expressions
	 */

	md.add("# Expressions");
	var expressions = json.expressions;

	plural = (expressions.length > 1) ? "are" : "is";
	md.add("#### There " + plural + " " + expressions.length + " expressions available");

	_.forEach(expressions, function (value, index) {
		var values = value.values;
		var params = value.params;

		//TODO flags better support
		var deprecated = (values.flags === "af_deprecated") ? "~~" : "";
		md.add(deprecated + "**" + values.category + "::" + values.display_string + "** : " + values.description + deprecated);

		var plural = (params.length > 1) ? "are" : "is";
		if (params.length >= 1) {
			//md.newline();
			//md.add("There " + plural + " " + params.length + " parameters : ");
			//md.newline();
		}
		md.newline();
		_.forEach(params, function (v, i) {
			var defaultValue = (v.defaultValue !== "") ? " (default value : " + v.defaultValue + ")" : "";
			md.add("* **" + v.text + "** : " + v.description + defaultValue);
			if (v.options.length >= 1) {
				_.forEach(v.options, function (value, index) {
					md.add("  * " + value);
				})
			}
		});
		md.newline();
		md.add("---");
		md.newline();
	});

	return md.get();
}

module.exports = {
	export: function (path, type) {
		switch (type) {
			case "json":
				return json_export(path);
				break;

			case "csv":
				console.log("csv");
				break;

			case "markdown":
				var json = json_export(path);
				return markdown_export(json);
				break;

			case "html":
				return marked(markdown_export(json_export(path)));
				break;
		}
	},
	getType: function(path) {
		var config = json_export(path).config;
		return (config.addon_type);
	}

};
