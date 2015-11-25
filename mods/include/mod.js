
exports.runtime = function(context) {
    context.vm_context.include = function(file) {
        var fs = require('fs'), path = require('path');
        file   = path.normalize(file);

        try {
            if(!fs.existsSync(file) || !fs.lstatSync(file))
                throw new Error(colors.red('Failed to include file ' + colors.cyan(file) + (argument('d', 'debug') ? '\n' + e.stack : '')));

            var content = fs.readFileSync(file, 'utf-8');
        }

        catch(e) {
            throw new Error(colors.red('Failed to include file ' + colors.cyan(file) + (argument('d', 'debug') ? '\n' + e.stack : '')));
        }

        context.vm_context.echo(neo_request(file, content, {neoServ: neoServ, request: context.request}));
        return true;
    };
};
