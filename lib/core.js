const fs = require('fs-extra');
const ncp = require('ncp');
const path = require('path');
const config = require('./config');
const zipFolder = require('zip-folder');
const execSync = require('child_process').execSync;
const prompt = require('prompt');
const ap = require('c2-addon-parser');

ncp.limit = 0;

const dirs = {
    HERE: path.join(process.cwd(), '/'),
    SOURCE: path.join(process.cwd(), '/source'),
    C2ADDON: path.join(process.cwd(), '/source/c2addon'),
    C3ADDON: path.join(process.cwd(), '/source/c3addon'),
    CAPX: path.join(process.cwd(), '/capx'),
    VERSIONS: path.join(process.cwd(), '/versions'),
    RELEASES: path.join(process.cwd(), '/releases')
};

const ADDON_NAME = process.cwd().split(path.sep).pop();

const allowedTypes = { PLUGIN: 'plugin', BEHAVIOR: 'behavior' };

const dist = { C2: 'C2', C3: 'C3'};

function init(addonType)
{
    if ( ! config.isReady())
    {
        _forceSetup();
        return;
    }

    const allowedTypesArr = Object.keys(allowedTypes).map(function(key_)
    {
        return allowedTypes[key_];
    });

    if (allowedTypesArr.indexOf(addonType) === -1)
    {
        return console.error("'" + addonType + "' type is not supported, please use one of following instead: " + allowedTypesArr.join(", "));
    }

    console.log('Initializing addon "' + ADDON_NAME + '"');


    if (_addonExists())
    {
        return console.error('ERROR: can\'t create addon, it already exists in this directory');
    }

    fs.mkdirSync(dirs.SOURCE);
    fs.mkdirSync(dirs.C2ADDON);
    fs.mkdirSync(dirs.C3ADDON);
    fs.mkdirSync(dirs.CAPX);
    fs.mkdirSync(dirs.VERSIONS);
    fs.mkdirSync(dirs.RELEASES);

    ncp(path.join(__dirname , '../templates' , addonType), dirs.C2ADDON, function (err)
    {
        if (err) return console.error(err);

        console.log("Template prepared successfully");

        fs.renameSync(path.join(dirs.C2ADDON, 'files/my' + addonType), path.join(dirs.C2ADDON, 'files', ADDON_NAME));

        var fileEditTime = path.join(dirs.C2ADDON, 'files', _getAddonName(), 'edittime.js');

        _replaceInFile(fileEditTime, new RegExp(/<your website or a manual entry on Scirra\.com>/, 'g'), config.getWebsite(), function()
        {
            _replaceInFile(fileEditTime, new RegExp(/<your name\/organisation>/, 'g'), config.getAuthor(), function()
            {
                _replaceInFile(fileEditTime, new RegExp(/MyPlugin/, 'g'), ADDON_NAME);
            });
        });

        var fileInfoXML = path.join(dirs.C2ADDON, 'info.xml');

        _replaceInFile(fileInfoXML, new RegExp(/name>(.*)<\/name/, 'g'), 'name>' + ADDON_NAME + '</name', function()
        {
            _replaceInFile(fileInfoXML, new RegExp(/author>(.*)<\/author/, 'g'), 'author>' + config.getAuthor() + '</author', function()
            {
                _replaceInFile(fileInfoXML, new RegExp(/website>(.*)<\/website/, 'g'), 'website>' + config.getWebsite() + '</website', function()
                {
                    _replaceInFile(fileInfoXML, new RegExp(/documentation>(.*)<\/documentation/, 'g'), 'documentation>' + config.getWebsite() + '</documentation');
                });
            });
        });

        var fileRuntime = path.join(dirs.C2ADDON, 'files', _getAddonName(), 'runtime.js');

        _replaceInFile(fileRuntime, new RegExp(/MyPlugin/, 'g'), ADDON_NAME);
    });

    ncp(path.join(__dirname, '../templates/capx'), dirs.CAPX, function (err)
    {
        if (err) return console.error(err);

        console.log("Capx prepared successfully");

        fs.renameSync(path.join(dirs.CAPX, 'capx.capx'), path.join(dirs.CAPX, ADDON_NAME + '.capx'));
    });

    ncp(path.join(__dirname, '../templates/bat'), dirs.HERE, function (err)
    {
        if (err) return console.error(err);

        console.log("Bats prepared successfully");
    });


}

//TODO continue process even after forcing setup
function _forceSetup()
{
    console.log('------ C2 Addon Assistant SETUP -----');
    console.log('Before using "c2addona" you must complete the c2-addon-assistant setup');
    config.startPrompt();
}

function update()
{
    if ( ! config.isReady())
        return _forceSetup();

    if ( ! _addonExists())
        return console.error('ERR: You are not in the root directory of the addon or addon does not exist');

    _runC2C3Converter();
    _createAddonFile(dist.C2, 'beta-' + ADDON_NAME);
    _createAddonFile(dist.C3, 'beta-' + ADDON_NAME);
    _generateACE();
    _updateC2Root();
}

function _generateACE()
{
    var ace = ap.export(path.join(dirs.C2ADDON, 'files', _getAddonName()), 'markdown');

    fs.writeFile(path.join(dirs.HERE, 'ACE.md'), ace, 'utf8', function (err)
    {
        if (err) return console.error(err);

        console.log('ACE.md created');
    });
}

function release()
{
    if ( ! config.isReady())
        return _forceSetup();

    if ( ! _addonExists())
        return console.error('ERR: You are not in the root directory of the addon or addon does not exist');

    if ( ! fs.existsSync('beta-' + ADDON_NAME + '.c2addon'))
        return console.error('Can\'t find "' + 'beta-' + ADDON_NAME + '.c2addon" file. Please run "c2addona update" before attempting to release.');

    var version = _getCurrentVersion();

    var versionsDir = dirs.VERSIONS + '/v' + version;

    if ( ! fs.existsSync(versionsDir))
    {
        fs.mkdirSync(versionsDir);
    }


    try
    {
        fs.copySync(path.join(dirs.HERE, '/beta-' + ADDON_NAME + '.c2addon'), path.join(versionsDir, ADDON_NAME + '_v' + version + '.c2addon'));
        fs.copySync(path.join(dirs.HERE, '/beta-' + ADDON_NAME + '.c3addon'), path.join(versionsDir, ADDON_NAME + '_v' + version + '.c3addon'));

        console.log('success!')
    }
    catch (err)
    {
        console.error(err)
    }

    fs.mkdirSync(path.join(versionsDir, '/capx'));
    ncp(dirs.CAPX, path.join(versionsDir, '/capx'), function (err)
    {
        if (err) return console.error(err);


        var releaseFile = path.join(dirs.RELEASES, ADDON_NAME + '_v' + version + '.zip');
        zipFolder(versionsDir, releaseFile, function(err)
        {
            if(err)
            {
                console.log('ERR: Could not create ' + releaseFile + ' file. ERROR-MESSAGE: ' + err);
            }
            else
            {
                console.log(releaseFile + ' created successfully');
            }

            fs.removeSync(path.join(versionsDir, 'capx'));
        });
    });

}

function _updateC2Root()
{
    var infoXML = path.join(dirs.C2ADDON, 'info.xml');
    infoXML = fs.readFileSync(infoXML, 'utf8');
    var addonType = (/type>plugin<\/type/.test(infoXML) ? allowedTypes.PLUGIN : allowedTypes.BEHAVIOR) + 's';

    ncp(path.join(dirs.C2ADDON, 'files'), path.join(config.getC2Root(), 'exporters/html5', addonType), function (err)
    {
        if (err) return console.error(err);

        console.log("New version updated to C2");
    });
}

function _runC2C3Converter()
{
    console.log("Converting to C3...");
    execSync('"' + path.join(__dirname,  '../C2C3AddonConverter/C2C3AddonConverter.exe') + '" "' + path.join(dirs.C2ADDON, 'files', _getAddonName()) + '" "' + dirs.C3ADDON + '"', {stdio: [0, 1, 2]});

    if (fs.existsSync(path.join(dirs.SOURCE, '/edittime.clean')))
    {
        fs.unlinkSync(path.join(dirs.SOURCE, '/edittime.clean'));
    }

    if (fs.existsSync(path.join(dirs.SOURCE, '/edittime.cleaner')))
    {
        fs.unlinkSync(path.join(dirs.SOURCE, '/edittime.cleaner'));
    }

    if (fs.existsSync(path.join(dirs.SOURCE, '/edittime.cleanest')))
    {
        fs.unlinkSync(path.join(dirs.SOURCE, '/edittime.cleanest'));
    }
}

function _createAddonFile(dist_, filename_)
{
    var source, fileExt;

    switch (dist_)
    {
        case dist.C2:
            source = dirs.C2ADDON;
            fileExt = '.c2addon';
            break;

        case dist.C3:
            source = dirs.C3ADDON;
            fileExt = '.c3addon';
            break;
    }

    filename_ += fileExt;

    zipFolder(source, path.join(dirs.HERE, filename_), function(err)
    {
        if(err)
        {
            console.log('ERR: Could not create ' + filename_ + ' file. ERROR-MESSAGE: ' + err);
        }
        else
        {
            console.log(filename_ + ' created successfully');
        }
    });
}

function _getAddonName()
{
    return process.cwd().split(path.sep).pop();
}

function _addonExists()
{
    return fs.existsSync(dirs.C2ADDON);
}

function _replaceInFile(file_, search_, replace_, callback)
{
    fs.readFile(file_, 'utf8', function (err, data)
    {
        if (err) return console.error(err);

        var result = data.replace(search_, replace_);

        fs.writeFile(file_, result, 'utf8', function (err)
        {
            if (err) return console.error(err);

            if (callback) callback();
        });


    });
}

function _updateVersionInFiles(version_)
{
    var versionXML = 'version>' + version_ + '</version';
    var versionEdittime = '"version":      "' + version_ + '"';
    var fileInfoXML = path.join(dirs.C2ADDON, 'info.xml');
    var fileEditTime = path.join(dirs.C2ADDON, 'files', _getAddonName(), 'edittime.js');

    _replaceInFile(fileInfoXML, new RegExp(/version>(.*)<\/version/, 'g'), versionXML);
    _replaceInFile(fileEditTime, new RegExp(/"version":\s*"[0-9\.]+"/, 'g'), versionEdittime);
}

function _getCurrentVersion()
{
    var infoXML = path.join(dirs.C2ADDON, 'info.xml');
    infoXML = fs.readFileSync(infoXML, 'utf8');
    return infoXML.match(/<version>(.*)<\/version>/)[1];
}

function setVersion(version_)
{
    if ( ! _addonExists())
        return console.error('ERR: You are not in the root directory of the addon or addon does not exist');

    if (version_)
    {
        if ( ! /[0-9\.]+/.test(version_))
            return console.error('ERR: Invalid characters in version number "' + version_ + '". Only 0-9 and "." allowed.');

        _updateVersionInFiles(version_);
    }
    else
    {
        console.log('Current version: ' + _getCurrentVersion());

        var schema =
        {
            properties:
            {
                version:
                {
                    pattern: /^[0-9\.]+$/,
                    message: 'Name must be only digits and dots',
                    required: true,
                    description: 'New version'
                 }
            }
        };

        prompt.start();

        prompt.get(schema, function (err, result)
        {
            _updateVersionInFiles(result.version);
        });
    }
}


module.exports = {
    init: init,
    update: update,
    release: function()
    {
        console.log('It happens often that we forget to update the version number, therefore extra check here.');
        var currentVersion = _getCurrentVersion();
        var schema =
        {
            properties:
            {
                answer:
                {
                    description: 'Release as version ' + currentVersion + '? (Y/n)',
                    required: true,
                    default: 'Y'
                }
            }
        };

        prompt.start();

        prompt.get(schema, function (err, result)
        {
            if (result.answer.toLowerCase() === 'y')
            {
                release();
            }
        });
    },
    setVersion: setVersion
};
