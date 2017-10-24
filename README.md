# Construct 2 Addon Assistant [![NPM version][npm-image]][npm-url]
> Construct addon development assistant


## Installation

```sh
$ npm i -g c2-addon-assistant
```


#### **CLI**
```sh
Usage: c2addona [options] [command]

Construct addon development assistant


Options:

  -V, --version  output the version number
  -h, --help     output usage information


Commands:

  init <addon_type>      Initialize the addon workspace
  update                 Copy working version to C2. Create/update beta *.c2addon and *.c3addon. Create/update ACE.md.
  release                Save current beta addons as version-marked addons and creates release zip file.
  config                 Starts config prompt
  set-version [version]  Sets the version in info.xml and edittime.js
```

### Usage example
> This example creates the "AwesomePlugin" plugin
1. Create directory named exactly like the plugin you're working on and enter it (`c2addona` takes addon name from the parent directory)
```sh
$ mkdir AwesomePlugin
$ cd AwesomePlugin
```
2. Now you're in the root of your plugin workspace and can create the workspace
```sh
$ c2addona init plugin
```
3. In result of workspace initialization, you'll have the following directory structure
```
?   release.bat
?   set-version.bat
?   update.bat
?
????capx
?       AwesomePlugin.capx
?
????releases
????source
?   ????c2addon
?   ?   ?   info.xml
?   ?   ?
?   ?   ????files
?   ?       ????AwesomePlugin
?   ?               common.js
?   ?               edittime.js
?   ?               PluginIcon.ico
?   ?               runtime.js
?   ?
?   ????c3addon
????versions
```
- `source/c2addon` - the place with code you will work with
- `source/c3addon` - C3 addon source generated automatically by `C2C3AddonConverter` tool by `blackhornet` (included)
- `capx/` - place for your example capxes
- `versions/` - contains versioned `c2addon` and `c3addon` files after using `c2addona release` command (or triggering `release.bat`)
- `releases/` - contains `AwesomePlugin_v<version>.zip` files generated after using `c2addona release` command (or triggering `release.bat`)

Three new files will appear after using `c2addona update` command (or triggering `update.bat`):
- `beta-AwesomePlugin.c2addon` - current working version of c2 addon
- `beta-AwesomePlugin.c3addon` - current working version of c3 addon
- `ACE.md` - acetable of current working version generated with [c2-addon-parser](https://github.com/armaldio/c2-addon-parser) by [Armaldio](https://armaldio.xyz)

## Support
Discord: https://discord.gg/ayRypRH

Facebook: https://www.facebook.com/C2C3Plugins

Under MIT license © [Toby R](http://www.neexeen.com)


[npm-image]: https://badge.fury.io/js/c2-addon-assistant.svg
[npm-url]: https://npmjs.org/package/c2-addon-assistant
