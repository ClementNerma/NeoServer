
exports.require('die');
exports.require('include');

exports.runtime = function(context) {
    var php = require('phpjs'), fs = require('fs'), cmv = context.vm_context;

    function normalize(file) {
        var o_file = file;
        file = path.normalize(file);
        var resolved = path.resolve(file), cwd = process.cwd();

        if(resolved.substr(0, cwd.length) !== cwd) {
            var parts = file.split('/'),
                safe  = [];

            for(var i = 0; i < parts.length; i += 1) {
                parts[i] = parts[i].replace(/[^a-zA-Z0-9_\-\+\/ "'\:\,\.\;\{\}\(\)\[\]]/g, '');
                if (!parts[i] || ('.' == parts[i])) {
                    continue;
                } else if('..' == parts[i]) {
                    safe.pop();
                    continue;
                } else {
                    safe.push(parts[i]);
                }
            }

            // Return the "clean" file
            file     = path.normalize(safe.join('/'));
            resolved = path.resolve(file);

            if(resolved.substr(0, cwd.length) !== cwd)
                throw new Error(colors.red('Unable to make path secured : ' + colors.cyan(o_file) + (argument('d', 'debug') ? '\nResolved : ' + resolved + '\nFinal : ' + file : '')));
        }

        return path.join(process.cwd(), (file.substr(0, 1) === '/' ? file.substr(1) : file));
    }

    /*for(var i in cmv)
        php[i] = cmv[i];

    cmv = php;*/

    for(var i in php)
        cmv[i] = php[i];

    cmv.is_dir = function(dir) {
        return cmv.file_exists(dir) && !fs.lstatSync(dir).isFile()
    };

    cmv.is_file = function(file) {
        return cmv.file_exists(file) && fs.lstatSync(file).isFile()
    };

    cmv.file_exists = function(file) {
        return fs.existsSync(normalize(file));
    };

    cmv.file_get_contents = function(file, charset) {
        if(!cmv.is_file(file))
            throw new Error('File not found ' + file);

        fs.readFileSync(normalize(file), charset || 'utf-8'); return ;
    };

    cmv.file_put_contents = function(file, content, charset) {
        fs.writeFileSync(normalize(file), content, charset || 'utf-8'); return ;
    };

    cmv.mkdir = function(dir) {
        fs.mkdirSync(normalize(dir)); return ;
    };

    cmv.unlink = function(file) {
        if(!cmv.is_file(file))
            throw new Error('File not found ' + file);

        fs.unlinkSync(file);
    };

};
