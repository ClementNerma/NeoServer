# NeoServer changelog

## NeoServer v1.1
- New : Support of "?" and "#" in URLs
- New : Added mods feature
- New : Allow **return** statement in inline-JS
- New : Added *echo* (alias of *print*) command for inline-JS
[Bug fixes]
- Fixed bug M003 : Multiple lines JS were not detected
- Fixed bug M002 : Server crashed if you don't specify *xcutable* parameter in your *.neoserv* file
- Fixed bug M001 : URL Rewriting was not working when the final URL not starting by a slash
[Notes]
- *skyer.js* example doesn't work for the moment

## NeoServer v1.0
- New : Serve web pages
- New : Serve binary files, including Content-Length
- New : Support of *.neoserv* files, including URL-Rewriting
- New : Support of command-line configuration
- New : Can log each request
- New : Command-line benchmark
- New : Support of Error Documents
- New : Support of inline JS in executables web pages
