# Construct 2 Addon parser [![NPM version][npm-image]][npm-url]
> A module to extract ACE table of a plugin

<a target='_blank' rel='nofollow' href='https://app.codesponsor.io/link/xUwNPd323FogQwpUUpKNVYuT/armaldio/c2-addon-parser'>
  <img alt='Sponsor' width='888' height='68' src='https://app.codesponsor.io/embed/xUwNPd323FogQwpUUpKNVYuT/armaldio/c2-addon-parser.svg' />
</a>

## Installation

```sh
$ npm i -g c2-addon-parser
$ npm i -S c2-addon-parser
```

## Usage

The plugin can used from both node script or cli

#### **API**
```javascript
var ap = require('c2-addon-parser');
var ace = ap.export("addon folder", "html/markdown/json");

var type = ap.getType("addon folder");
```

#### **CLI**
```sh
// regular export
acetable -d addon_folder -e export_type

// export and write file to the addon directory
acetable -d addon_folder -e export_type -o table.md

// use -t to only get the type of the addon
acetable -t -d addon_folder
```

### Available export 
- [x] JSON
- [x] HTML
- [x] Markdown

### Addon support
- [x] Behaviour
- [x] Plugin

## Coming
* Effects

## License

MIT © [Armaldio](armaldio.xyz)


[npm-image]: https://badge.fury.io/js/c2-addon-parser.svg
[npm-url]: https://npmjs.org/package/c2-addon-parser
[travis-image]: https://travis-ci.org/armaldio/c2-addon-parser.svg?branch=master
[travis-url]: https://travis-ci.org/armaldio/c2-addon-parser
[daviddm-image]: https://david-dm.org/armaldio/c2-addon-parser.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/armaldio/c2-addon-parser
