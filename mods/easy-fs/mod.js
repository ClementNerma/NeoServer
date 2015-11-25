
exports.runtime = function(context) {
    if(!mods.hasOwnProperty('allow_modules_access'))
        context.easy_fs = false;

    context.vm_context.easy_fs = new (function() {
        var fs   = require('fs'),
            path = require('path');

        this.writeFile = function(file, content, charset) {
            try { fs.writeFileSync(file, content, charset || 'utf-8'); return true; }
            catch(e) { return e; }
        };

        this.readFile = function(file, charset) {
            try { return fs.readFileSync(file, charset || 'utf-8'); }
            catch(e) { return e; }
        };

        this.mkdir = function(dir) {
            try { fs.mkdirSync(dir); return true; }
            catch(e) { return e; }
        };
    })();
};
