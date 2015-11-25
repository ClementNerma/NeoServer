
exports.runtime = function(ctx) {
    ctx.vm_context.die = function(content) {
        throw new Error('{$die:error}' + content);
    };
}

exports.on('vm_error', function(ctx) {
    if(ctx.message.substr(0, 12) === '{$die:error}') {
        ctx.runtime.stopExec = true;
        return ctx.insert + ctx.message.substr(12);
    }
});
