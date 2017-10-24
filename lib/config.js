const fs = require('fs');
const prompt = require('prompt');
const path = require('path');

const CONFIG_FILE = path.join(__dirname, '../../c2addona-config.json');

var data = {};

if (fs.existsSync(CONFIG_FILE))
{
    data = fs.readFileSync(CONFIG_FILE);
    data = JSON.parse(data);
    //console.log('config ready');
}

function isReady()
{
    return (data && data.author && data.c2Root && data.website);
}

function setAuthor(author_)
{
    data.author = author_;
}

function getWebsite()
{
    return data.website;
}

function getAuthor()
{
    return data.author;
}

function setWebsite(website_)
{
    data.website = website_;
}

function setC2Root(c2Root_)
{
    data.c2Root = c2Root_;

    var lastCharacter = c2Root_.substr((c2Root_.length - 1));
    if (['\\', '/'].indexOf(lastCharacter) === -1)
    {
        data.c2Root += '/';
    }
}

function getC2Root()
{
    return data.c2Root;
}

function save()
{
    var dataStr = JSON.stringify(data);

    fs.writeFile(CONFIG_FILE, dataStr, function (err)
    {
        if (err)
        {
            console.log('There has been an error saving your configuration data.');
            console.log(err.message);
            return;
        }
        console.log('Configuration saved successfully.')
    });
}


function startPrompt()
{
    var schema =
    {
        properties:
        {
            author:
            {
                required: true
            },
            c2Root:
            {
                required: true
            },
            website:
            {
                required: true
            }
        }
    };

    prompt.start();

    prompt.get(schema, function (err, result)
    {
        setAuthor(result.author);
        setC2Root(result.c2Root);
        setWebsite(result.website);
        save();
    });
}

module.exports = {
    isReady: isReady,
    getAuthor: getAuthor,
    getWebsite: getWebsite,
    getC2Root: getC2Root,
    startPrompt: startPrompt
};
