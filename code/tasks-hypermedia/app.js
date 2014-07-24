/* tasks hypermedia example */

var fs = require('fs');
var http = require('http');
var querystring = require('querystring');

var g = {};
g.host = '0.0.0.0';
g.port = (process.env.PORT ? process.env.PORT : 8484);

/* internal test data */
g.list = [];
g.list[0] = {id:0,text:'this is some item',link:{rel:'complete',href:'/tasks/complete/',method:'post',data:[{name:'id'}]}};
g.list[1] = {id:1,text:'this is another item',link:{rel:'complete',href:'/tasks/complete/',method:'post',data:[{name:'id'}]}};
g.list[2] = {id:2,text:'this is one more item',link:{rel:'complete',href:'/tasks/complete/',method:'post',data:[{name:'id'}]}};
g.list[3] = {id:3,text:'this is possibly an item',link:{rel:'complete',href:'/tasks/complete/',method:'post',data:[{name:'id'}]}};

// main entry point
function handler(req, res) {

  var m = {};
  m.item = {};
  m.search = '';
  
  // internal urls
  m.homeUrl = '/';
  m.listUrl = '/tasks/';
  m.scriptUrl = '/tasks.js';
  m.searchUrl = '/tasks/search';
  m.completeUrl = '/tasks/complete/';

  // media-type identifiers
  m.appJson  = {'content-type':'application/json'};
  m.textHtml = {'content-type':'text/html'};
  m.appJS = {'content-type':'application/javascript'};

  // add support for CORS
  var headers = {
    'Content-Type' : 'application/json',
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods' : '*',
    'Access-Control-Allow-Headers' : '*'
  };

  // hypermedia controls
  m.errorMessage = '{"error":"{@status}", "message":"{@msg}"}';
  m.addControl = {rel:'add',href:'/tasks/',method:'post',data:[{name:'text'}]};
  m.searchControl = {rel:'search',href:'/tasks/search',method:'get',data:[{name:'text'}]};
  m.listControl = {rel:'list',href:'/tasks/',method:'get'};
  m.completeControl = {rel:'complete',href:'/tasks/complete/',method:'post',data:[{name:'id'}]}

  // add support for CORS
  var headers = {
    'Content-Type' : 'application/json',
    'Access-Control-Allow-Origin' : '*',
    'Access-Control-Allow-Methods' : '*',
    'Access-Control-Allow-Headers' : '*'
  };

  main();

  /* process requests */
  function main() {
    var url;

    // check for a search query
    if(req.url.indexOf(m.searchUrl)!==-1) {
      url = m.searchUrl;
      m.search = req.url.substring(m.searchUrl.length,255).replace('?text=','');
    }
    else {
      url = req.url;
    }

    // handle CORS OPTIONS call
    if(req.method==='OPTIONS') {
        var body = JSON.stringify(headers);
        showResponse(req, res, body, 200);
    }

    // process request
    switch(url) {
      case m.homeUrl:
        switch(req.method) {
          case 'GET':
            showHtml();
            break;
          default:
            showError(405, 'Method not allowed');
            break;
        }
        break;
      case m.scriptUrl:
        switch(req.method) {
          case 'GET':
            showScript();
            break;
          default:
            showError(405, 'Method not allowed');
            break;
        }
        break;
      case m.listUrl:
        switch(req.method) {
          case 'GET':
            sendList();
            break;
          case 'POST':
            addToList();
            break;
          default:
            showError(405, 'Method not allowed');
            break;
        }
        break;
      case m.searchUrl:
        switch(req.method) {
          case 'GET':
            searchList();
            break;
          default:
            showError(405, 'Method not allowed');
            break;
        }
        break;
      case m.completeUrl:
        switch(req.method) {
          case 'POST':
            completeItem();
            break;
          default:
            showError(405, 'Method not allowed');
            break;
        }
        break;
      default:
        showError(404, 'Page not found');
        break;
    }
  }

  /* 
    show list of items

    /tasks/
 
  */
  function sendList() {
    var msg;

    msg = {};
    msg.links =[];
    msg.collection = g.list;

    msg.links.push(m.addControl);

    if(msg.collection.length>0) {
      msg.links.push(m.listControl);
      msg.links.push(m.searchControl);
    }

    res.writeHead(200, 'OK', m.appJson);
    res.end(JSON.stringify(msg,null,2));
  }

  /* 
     search the list

     /tasks/search?text={text} 

  */
  function searchList() {
    var search, i, x, msg;

    search = [];
    for(i=0,x=g.list.length;i<x;i++) {
      if(g.list[i].text.indexOf(m.search)!==-1) {
        search.push(g.list[i]);
      }
    }

    msg = {};
    msg.links =[];
    msg.collection = search;

    msg.links.push(m.addControl);
    msg.links.push(m.listControl);

    if(msg.collection.length>0) {
      msg.links.push(m.searchControl);
    }

    res.writeHead(200, 'OK', m.appJson);
    res.end(JSON.stringify(msg, null, 2));
  }

  /* 
     add item to list

     /tasks/
     text={text} 

  */
  function addToList() {
    var body = '';

    req.on('data', function(chunk) {
      body += chunk.toString();
    });

    req.on('end', function() {
      m.item = querystring.parse(body);
      sendAdd();
    });
  }
  function sendAdd() {
    var item;

    item = {};
    item.link = m.completeControl;
    item.id = g.list.length;
    item.text = m.item.text;
    g.list.push(item);

    res.writeHead(204, "No content");
    res.end();
  }

  /* 
     complete single item

     /tasks/complete/
     id={id} 

  */
  function completeItem() {
    var body = '';

    req.on('data', function(chunk) {
      body += chunk.toString();
    });

    req.on('end', function() {
      m.item = querystring.parse(body);
      sendComplete();
    });
  }
  function sendComplete() {
    var tlist, i, x;

    //build new list
    tlist = [];
    for(i=0,x=g.list.length;i<x;i++) {
      if(g.list[i].id!=m.item.id) {
        tlist.push(g.list[i]);
      }
    }
    g.list = tlist.slice(0);

    res.writeHead(204, "No content");
    res.end();
  }

  /* show html page */
  function showHtml() {
    fs.readFile('index.html', 'ascii', sendHtml);
  }
  function sendHtml(err, data) {
    if (err) {
      showError(500, err.message);
    }
    else {
      res.writeHead(200, "OK",m.textHtml);
      res.end(data);
    }
  }

  /* show script file */
  function showScript() {
    fs.readFile('tasks.js', 'ascii', sendScript);
  }
  function sendScript(err, data) {
    if (err) {
      showError(500, err.message);
    }
    else {
      res.writeHead(200, "OK",m.appJS);
      res.end(data);
    }
  }

  /* show error page */
  function showError(status, msg) {
    res.writeHead(status, msg, m.appJson);
    res.end(m.errorMessage.replace('{@status}', status).replace('{@msg}', msg));
  }
}

// return response to caller
function showResponse(req, res, body, code) {
    res.writeHead(code,headers);
    res.end(body);
}

// listen for requests
http.createServer(handler).listen(g.port, g.host);

// ***** END OF FILE *****

