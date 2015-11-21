
# NeoServer

**NeoServer** is a Node.js module to create a web server easily.

## How to install

To install NeoServer, you first needs to install the [NodeJS Package Manager (npm)](https://www.npmjs.com/).

Then, type the following command in your terminal :

```sh
npm install neo-server -g
```

**NOTE :** The *-g* argument install NeoServer globally. This permit to use NeoServer everywhere and access to the 'neo' command.

## Create your server

Now, let's create your own server !
First, create an empty folder anywhere on your computer, and then go into using a terminal.

```sh
mkdir neo-site
cd neo-site
```

Create a first page, named **index.html**, and put into a content like *Hello world !*

Then, run the server.

```sh
neo
```

The server will be launched on port **8080**. Open a browser like Firefox, and type in the URL bar :
http://localhost:8080
And see the result !

## Command-line options

Argument                | Default    | Description
----------------------- | ---------- | -----------
--port                  | 8080       | Port to run the server
--encoding              | utf-8      | The web pages encoding
--rootfile              | index.html | Files to use when the URL terminates by a slash
--disable-neoserv-files | false      | Set to "true" to disable *.neoserv* files execution
--log-requests          |            | Set to a value to log all incoming requests and store it in the specified file
--dynamic-neoserv-file  | false      | Set to "true" to reload *.neoserv* file at each incoming requests
--benchmark             | false      | Set to "true" to display time spent to send the request (in miliseconds)

## *.neoserv* files

*.neoserv* files permit to perform actions on the server, like *.htaccess* on **Apache**.
A *.neoserv* file is organized around *categories* and *parameters*. There is one thing by line.

Example :

```neoserv
rootfile = index.html,index.htm
xcutable = html,htm

[mime-types]
jsp = application/javascript

[deny]
private/

[errorDocument]
ErrorDocument 404 errors/404.html

[rewrite]
RewriteUrl errors/* errors/$1.html
```

Let's see how it does...
First, we define two **globals** parameters : *rootfile* and *xcutable*.

*rootfile* permit to override the same command-line parameter. File names all separated by commas.
*xcutable* define files which can have inline **runable** JavaScript content.

Next, this file define a *category* : *mime-types*.
This category permit to define the [Mime-Type](https://en.wikipedia.org/wiki/MIME) of different file extensions.
Here, there is a parameter to define *.jsp* extension as *application/javascript* mime-type.

Next, the *deny category*, that make client unable to access to certain URLs.
To forbid access to an entire directory, make the name terminate by a slash, like here.

The *errorDocument* indicate what HTML page use when there is an error. If you don't specify an error document, the default document is used : a big title that indicate there was an error.
Here, the page *errors/404.html* is called each time there is a **404** (Not Found) error.

Finally, the *rewrite category*, the most powerful too, permit to redirect URLs to others. The URL in the client's URL bar will not be changed, but the server will deliver the content of the specified page.
For example, if the client access to *errors/500*, the server will deliver the content of the page *errors/500.html*.

## Use inline JavaScript

In an executable web page (default : all files with *.html* extension), you can use **inline JavaScript**.
That's a JS code which perform operations. Example of using :

```html
<p>You are seeing the URL : <% request.url %></p>
```

The code between *<%* and *%>* is runned and the result is placed in the page. For example, if the URL is **documents/interview.html**, the displayed content will be :

```html
<p>You are seeing the URL : documents/interview.html</p>
```

You can access to only three variables : *require*, *request* and *response*. *request* and *response* are Node.js variables. 
