#!/usr/bin/env node

function argument(_short, _long) {
    return (_short ? short[_short] : undefined) || (_long ? long[_long] : undefined);
}

var unsorted_args = process.argv.splice(2);

var args  = [];
var short = {};
var long  = {};

for(var i = 0; i < unsorted_args.length; i++) {
	if(unsorted_args[i].substr(0, 1) === '-') {
		var isLong = unsorted_args[i].substr(0, 2) === '--';
		var hasEqual = unsorted_args[i].indexOf('=') !== -1;
		(isLong ? long : short)[hasEqual ? unsorted_args[i].substr(1 + isLong, unsorted_args[i].indexOf('=') - 1 - isLong) : unsorted_args[i].substr(1 + isLong)] = (hasEqual ? unsorted_args[i].substr(unsorted_args[i].indexOf('=') + 1) : true);
	} else
		args.push(unsorted_args[i]);
}

var http         = require('http'),
    fs           = require('fs'),
    path         = require('path'),
    colors       = require('chalk'),
    vm           = require('vm'),
    isbinaryfile = require('isbinaryfile'),
    cmdArgs      = process.argv.splice(2), config = {
        port     : argument('p', 'port') || 8080,
        encoding : argument('e', 'encoding') || 'utf-8',
        rootfile : (argument('i', 'index') || 'index.html').split(',')
    }, neoServ, mods = {}, events = {};

function load_neoserv_file() {
    neoServ     = {
        'errors-code': {
            403: 'Forbidden',
            404: 'Not Found',
            500: 'Internal Server Error'
        },

        'mime-types': {
            html: 'text/html',
            htm : 'text/html',
            css : 'text/css',
            xml : 'text/xml',
            txt : 'text/plain',
            csv : 'text/csv',

            js  : 'application/javascript',
            zip : 'application/zip',
            json: 'application/json',
            pdf : 'application/pdf',
            ogg : 'application/ogg',
            sfw : 'application/x-shockwave-flash',

            gif : 'image/gif',
            jpg : 'image/jpeg',
            jpeg: 'image/jpeg',
            png : 'image/png',
            tiff: 'image/tiff',
            svg : 'image/svg+xml',

            mp3 : 'audio/mpeg',
            wav : 'audio/wav',
            wma : 'audio/x-ms-wma',

            mp4 : 'video/mp4',
            wmv : 'video/x-ms-wmv',
            avi : 'video/x-msvideo',
            flv : 'video/x-flv',
            webm: 'video/webm',

            xls : 'application/vnd.ms-excel',
            xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            ppt : 'application/vnd.ms-powerpoint',
            pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            doc : 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            xul : 'application/vnd.mozilla.xul+xml',

            odt : 'application/vnd.oasis.opendocument.text',
            ods : 'application/vnd.oasis.opendocument.spreadsheet',
            odp : 'application/vnd.oasis.opendocument.presentation',
            odg : 'application/vnd.oasis.opendocument.graphics',
            odc : 'application/vnd.oasis.opendocument.chart',
            odf : 'application/vnd.oasis.opendocument.formula',
            odb : 'application/vnd.oasis.opendocument.database',
            odi : 'application/vnd.oasis.opendocument.image',
            odm : 'application/vnd.oasis.opendocument.text-master',

            ott : 'application/vnd.oasis.opendocument.text-template',
            ots : 'application/vnd.oasis.opendocument.spreadsheet-template',
            otp : 'application/vnd.oasis.opendocument.spreadsheet-template',
            otg : 'application/vnd.oasis.opendocument.graphics-template',

            '.binary': 'application/octet-stream',
            'default': 'text/plain'
        },

        xcutable: ['html']
    };

    if(fs.existsSync('.neoserv') && fs.lstatSync('.neoserv').isFile() && argument('n', 'disable-neoserv-files') !== 'true') {
        try {
            var neofile = fs
                .readFileSync('.neoserv', 'utf-8')
                .replace(/###((.|\n)*?)###/g, '')
                .replace(/#(.*)$/mg, '')
                .split('\n'),
                line, value, category;

            for(var i = 0; i < neofile.length; i += 1) {
                line = neofile[i].trim();

                if(!line)
                    continue;

                if(line.substr(0, 1) === '[' && line.substr(line.length - 1, 1)) {
                    category = line.substr(1, line.length - 2);

                    if(!neoServ.hasOwnProperty(category) && typeof neoServ[category] !== 'undefined')
                        throw new Error(colors.red(colors.cyan('.neoserv') + ' : System-reserved category name at line ' + + colors.green(i + 1)));

                    if(!neoServ.hasOwnProperty(category))
                        neoServ[category] = {};
                } else {
                    line  = line.replace(/^([a-zA-Z_]+)( +)([^ =]+)( +)([^ ]+)$/, '$3=$5');

                    if(line.indexOf('=') === -1) {
                        if(category) {
                            if(!Array.isArray(neoServ[category])) {
                                if(Object.keys(neoServ[category]).length)
                                    throw new Error(colors.red(colors.cyan('.neoserv') + ' : Can\'t use un-assignemnt in assignment category at line ' + colors.green(i + 1)));

                                neoServ[category] = [];
                            }

                            neoServ[category].push(line);
                        } else
                            throw new Error(colors.red(colors.cyan('.neoserv') + ' : Bad syntax at line ' + colors.green(i + 1)));
                    } else {
                        value = line.substr(line.indexOf('=') + 1).trim();
                        line  = line.substr(0, line.indexOf('=')).trim();

                        if(!category) {
                            neoServ[line] = value;
                        } else {
                            if(Array.isArray(neoServ[category]))
                                throw new Error(colors.red(colors.cyan('.neoserv') + ' : Can\'t use assignemnt in un-assignment category at line ' + colors.green(i + 1)));

                            neoServ[category][line] = value;
                        }
                    }
                }
            }

            if(neoServ.hasOwnProperty('rootfile') && neoServ.replaceConfig !== 'false')
                config.rootfile = neoServ.rootfile.split(',');

            if(neoServ.hasOwnProperty('xcutable') && typeof neoServ.xcutable === 'string')
                config.xcutable = neoServ.xcutable.split(',');

            if(neoServ.hasOwnProperty('rewrite') && !Array.isArray(neoServ.rewrite)) {
                var frewrite = [];

                for(var i in neoServ.rewrite) {
                    frewrite.push([
                        new RegExp('^\\/' + i
                            .replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1")
                            .replace(/\\\?/g, '(.)')
                            .replace(/\\\*/g, '(.*?)') + '$'),
                        neoServ.rewrite[i]
                    ]);
                }

                neoServ.rewrite = frewrite;
            }

            if(neoServ.hasOwnProperty('deny') && Array.isArray(neoServ.deny)) {
                for(var i = 0; i < neoServ.deny.length; i += 1) {
                    neoServ.deny[i] = path.normalize(neoServ.deny[i]);
                }
            }
        }

        catch(e) {
            console.error(colors.red('Failed to load ' + colors.cyan('.neoserv') + ' file'), argument('d', 'debug') ? e.stack : e);
        }
    }
}

var load_mods;

if(load_mods = argument('m', 'mods')) {
    if(typeof load_mods !== 'string')
        throw new Error(colors.red(colors.cyan('mods') + ' argument must be a string'));

    var dir, mod, exports;
    load_mods = load_mods.split(',')

    for(var i = 0; i < load_mods.length; i += 1) {
        if(!mods.hasOwnProperty(load_mods[i])) {
            dir = path.join(__dirname, 'mods', load_mods[i]);

            try {
                if(!fs.existsSync(dir) || fs.lstatSync(dir).isFile()) {
                    console.error(colors.red('Can\'t load mod ' + colors.cyan(load_mods[i]) + ' : module not found'));
                    process.exit();
                }
            }

            catch(e) {
                console.error(colors.red('Can\'t load mod ' + colors.cyan(load_mods[i]) + ' : Can\'t access to ' + colors.green(__dirname) + (argument('d', 'debug') ? '\n' + e.stack : '')));
                process.exit();
            }

            try {
                mod = fs.readFileSync(path.join(dir, 'mod.js'), 'utf-8');
            }

            catch(e) {
                console.error(colors.red('Can\'t load mod ' + colors.cyan(load_mods[i]) + ' : Can\'t access to ' + colors.green(path.join(dir, 'mod.js') + (argument('d', 'debug') ? '\n' + e.stack : ''))));
                process.exit();
            }

            try {
                exports = mods[load_mods[i]] = {
                    on: function(name, callback) {
                        return typeof callback === 'function' ? events[name] = callback : events[name];
                    },

                    require: function(mod) {
                        load_mods.push(mod);
                    }
                };

                eval(mod);
            }

            catch(e) {
                console.error(colors.red('Can\'t load mod ' + colors.cyan(load_mods[i]) + ' : Runtime error' + (argument('d', 'debug') ? '\n' + e.stack : '')));
                process.exit();
            }
        }
    }
}

load_neoserv_file();
var httpRequest;

function call_event(name, args, additionnalArgs) {
    if(!events[name])
        return false;

    if(typeof additionnalArgs === 'object') {
        for(var i in additionnalArgs) {
            args[i] = additionnalArgs[i];
        }
    }

    return events[name](args);
};

function denied(file) {
    if(!neoServ.hasOwnProperty('deny') || !Array.isArray(neoServ.deny))
        return false;

    file = path.normalize(file);

    for(var i = 0; i < neoServ.deny.length; i += 1) {
        if(file.substr(0, neoServ.deny[i].length) === neoServ.deny[i])
            return true;
    }

    return false;
}

function neo_request(file, content, req, code) {
    var request = req.request, response = req.response, neoServ = req.neoServ,
        split   = file.split('/');

    if(denied(file) || split[split.length - 1] === '.neoserv') {
        error(403);
        return false;
    }

    var ext = split[split.length - 1];

    var s = ext.split('.');
    ext = s.length > 1 ? s[s.length - 1] : false;

    if(content instanceof Buffer) {
        response.writeHead(code || 200, {
            'Content-Type': neoServ['mime-types'][ext] || neoServ['mime-types']['.default'],
            'Content-Length': content.length
        });

        response.end(content);
        return true;
    } else {
        if(neoServ.xcutable.indexOf(ext) !== -1) {
            /*var ctx = vm.createContext({
                request: request,
                require: require
            });*/

            var cut = content.split('\n'), index, runtime = {
                stopExec: false
            };

            for(var i = 0; i < cut.length; i += 1) {
                /*if((index = cut[i].indexOf('<%')) !== -1)
                    cut[i] = cut[i].substr(0, index) + '<%' + (i + 1) + cut[i].substr(index + 2);*/
                cut[i] = cut[i].replace(/<%/g, '<%' + (i + 1));
            }

            content  = cut.join('\n');

            content  = content.replace(/<%([0-9]+)((.|\n)*?)%>/g, function(match, line, neo) {
                if(runtime.stopExec)
                    return '';

                try {
                    //var c = vm.runInContext(neo, ctx);
                    /*var c = (new vm.Script(neo, {
                        filename: file,
                        displayErrors: false
                    })).runInContext(ctx);*/

                    function get_mod_context() {
                        return {
                            request      : request,
                            response     : response,
                            line         : line,
                            vm_script    : script,
                            vm_code      : neo,
                            vm_context   : ctx,
                            runtime      : runtime
                        }
                    }

                    var ctx = {
                        request : request ,
                        response: response,
                        mods    : mods,
                        echo    : function(content) {
                            insert += content;
                        }
                    }, script = vm.createScript(neo.split('\n').length > 1 ? '(function() { /*function echo(content) { insert += content; } function print(content) { insert += content; }*/ ' + neo + '})();' : neo, file);

                    for(var i in mods) {
                        if(mods[i].runtime) {
                            exports = mods[i];
                            mods[i].runtime(get_mod_context(), mods[i]);
                        }
                    }

                    var insert = '', c = script.runInNewContext(ctx, file);
                    call_event('vm_end', get_mod_context(), {result: c, insert: insert, final_result: insert || c});

                    c     = insert || c; // doesn't work

                    return (c || typeof c === 'string' || typeof c === 'number') ? c : '';
                }

                catch(e) {
                    var o = e;
                    e = e.stack.split('\n');
                    var stack = e[0], el, lin, col, fil, already = false, backtrace = [];

                    for(var i = 1; i < e.length; i += 1) {
                        if(e[i].trim().substr(0, file.length + 4) !== 'at ' + file + ':' && already)
                            break;

                        fil = null;

                        if(e[i].trim().substr(0, file.length + 4) === 'at ' + file + ':') {
                            fil     = file;
                            already = true;
                        }

                        el  = e[i].trim().substr(3);
                        lin = parseInt(el.substr(el.indexOf(':') + 1, el.lastIndexOf(':') - el.indexOf(':') - 1)) + (fil ? line - 1 : 0);
                        col = el.substr(el.lastIndexOf(':') + 1);
                        fil = el.substr(0, el.indexOf(':'));

                        backtrace.push({
                            file: file,
                            line: lin,
                            col : col
                        });

                        stack += '<br />&nbsp;&nbsp;&nbsp;&nbsp;at ' + fil + ':' + lin + ':' + col;
                    }

                    var ret = call_event('vm_error', get_mod_context(), {
                        backtrace: backtrace,
                        stack: stack,
                        error: e,
                        message: o.message,
                        insert: insert
                    });

                    if(typeof ret !== 'undefined')
                        return ret;

                    if(!already) { // bug protection
                        stack = e[0] + '<br />&nbsp;&nbsp;&nbsp;&nbsp;<em>Unknwon stack</em>';
                        console.log(e.join('\n'));
                    }

                    return '<div class="neo-error" style="background-color:orange;border:1px solid black;padding:5px;padding-left:15px;font-family:monospace;">' + stack + '</div>';
                }
            });
        }

        if(response) {
            response.writeHead(code || 200, {
                'Content-Type': neoServ['mime-types'][ext] || neoServ['mime-types']['.default'],
                'Content-Length': content.length
            });

            call_event('send_response', {content: content});

            response.end(content);

            return true;
        } else {
            return content;
        }
    }
}

http.createServer(httpRequest = function(request, response) {

    var receivedRequest = Date.now();

    if(argument(false, 'log-requests')) {
        try {
            fs.appendFileSync(argument(false, 'log-requests'), Date.now() + ' ' + request.url + '\n', 'utf-8');
        }

        catch(e) {
            console.log(colors.red('Failed to store log :\n' + e.stack));
        }
    }

    if(argument('n', 'dynamic-neoserv-file') !== 'false')
        load_neoserv_file();

    function send(file, content, code) {
        return neo_request(file, content, {
            request: request,
            response: response,
            mods: mods,
            neoServ: neoServ
        }, code);
    }

    function error(errCode) {

        console.error(colors.red(errCode + ' ' + (neoServ['errors-code'][errCode] || '') + ' : ') + colors.green(request.treatUrl));

        if(neoServ.hasOwnProperty('errorDocument') && neoServ.errorDocument.hasOwnProperty(errCode)) {
            try {
                var content = fs.readFileSync(neoServ.errorDocument[errCode], neoServ.encoding || config.encoding);
            }

            catch(e) {
                console.error(colors.red('Cannot read ' + errCode + ' error template (') + colors.green(neoServ.errorDocument[errCode]) + colors.red(')' + (neoServ.verbose ? e.stack : '')));
            }

            if(typeof content !== 'undefined') {
                send(neoServ.errorDocument[errCode], content, errCode);
                console.info(colors.blue('Delivered ' + errCode + ' template : ') + colors.green('/' + neoServ.errorDocument[errCode]));
                return ;
            }
        }

        send(errCode + '.html', '<h1>' + errCode + ' ' + (neoServ['errors-code'][errCode] || '') + '</h1>', errCode);
        return ;

    }

    var final;
    request.treatUrl = decodeURI(request.url.replace(/(\?|#)(.*)$/, ''));

    if(neoServ.hasOwnProperty('rewrite') && Array.isArray(neoServ.rewrite)) {
        for(var i = 0; i < neoServ.rewrite.length; i += 1) {
            if((final = request.url.replace(neoServ.rewrite[i][0], neoServ.rewrite[i][1])) !== request.url) {
                //request.treatUrl = '/' + request.treatUrl.replace(neoServ.rewrite[i][0], neoServ.rewrite[i][1]);
                request.treatUrl = (final.substr(0, 1) === '/' ? '' : '/') + final;
                break;
            }
        }

        if(request.treatUrl !== request.url)
            call_event('url_rewrited', {origin: request.url, rewrited: request.treatUrl, request: request});
    }

    var dest = path.normalize(request.treatUrl).substr(1);

    try {
        var dest_exists = fs.existsSync(dest);
    }

    catch(e) {
        console.error(colors.red('Failed to check if requested file exists [' + colors.cyan(request.treatUrl) + '] [' + colors.green(dest) + ']') + (argument('d', 'debug') ? '\n' + e.stack : ''));
        error(500);

        if(argument('b', 'benchmark') !== 'false')
            console.log('Request sent in ' + (Date.now() - receivedRequest) + ' ms');

        return ;
    }

    if(!dest_exists) {
        error(404);

        if(argument('b', 'benchmark') !== 'false')
            console.log('Request sent in ' + (Date.now() - receivedRequest) + ' ms');

        return ;
    }

    try {
        var dest_is_directory = !fs.lstatSync(dest).isFile();
    }

    catch(e) {
        console.error(colors.red('Failed to check if requested resource is a directory [' + colors.cyan(request.treatUrl) + '] [' + colors.green(dest) + ']') + (argument('d', 'debug') ? '\n' + e.stack : ''));
        error(500);

        if(argument('b', 'benchmark') !== 'false')
            console.log('Request sent in ' + (Date.now() - receivedRequest) + ' ms');

        return ;
    }

    if(dest_is_directory) {
        var file, content;

        for(var i in config.rootfile) {
            try {
                file = path.join(dest, config.rootfile[i]);
                content = fs.readFileSync(file, neoServ.encoding || config.encoding);
            }

            catch(e) {
                if(cmdArgs.verbose)
                    console.error(colors.red('Failed to read index file : ') + colors.green(file));
            }

            if(typeof content !== 'undefined') {
                call_event('rootfile_used', {url: request.treatUrl, destination: dest, file: file, content: content, request: request})
                send(dest, content);
                console.info(colors.blue('Delivered : ') + colors.green('/') + ' [' + colors.cyan(file) + ']');
                return ;
            }
        }

        // list all files in the directory
        console.log('List all files...');

        error(404);

        if(argument('b', 'benchmark') !== 'false')
            console.log('Request sent in ' + (Date.now() - receivedRequest) + ' ms');

        call_event('request_sent_no_error', {url: request.treatUrl, destination: dest, duration: (Date.now() - receivedRequest), request: request});

        return ;
    }

    try {
        var content  = fs.readFileSync(dest);
        var isBinary = isbinaryfile.sync(content, fs.lstatSync(dest).size);

        if(!isBinary)
            content = content.toString(neoServ.encoding || config.encoding);
    }

    catch(e) {
        error(404);

        if(argument('d', 'debug'))
            console.log(e.stack);

        if(argument('b', 'benchmark'))
            console.log('Request sent in ' + (Date.now() - receivedRequest) + ' ms');

        return ;
    }

    if(typeof content !== 'undefined')
        if(send(request.treatUrl.substr(1), content))
            console.info(colors.blue('Delivered : ') + colors.green(request.url) + (request.url !== request.treatUrl ? ' [' + colors.cyan(request.treatUrl) + ']' : ''));

    if(argument('b', 'benchmark'))
        console.log('Request sent in ' + (Date.now() - receivedRequest) + ' ms');

}).listen(config.port);

console.log(colors.blue('Server started on port ' + colors.cyan(config.port)));
console.log('Press Ctrl+C to stop');
