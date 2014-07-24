/* Tasks CRUD
   tasks.js 
*/

window.onload = function() {
  var pg;
  pg = thisPage();
  pg.init();
};

var thisPage = function() {

  var g = {};
  g.msg = {};

  g.addUrl = '/tasks/';
  g.listUrl = '/tasks/';
  g.searchUrl = '/tasks/search?text={@text}';
  g.completeUrl = '/tasks/complete/';

  // prime system
  function init() {
    initButtons();
    refreshList();
  }

  // handle "list"
  function refreshList() {
    makeRequest(g.listUrl,'list');
  }

  // handle "search"
  function searchList() {
    var text;

    text = prompt('Enter search:');
    if(text) {
      makeRequest(g.searchUrl.replace('{@text}',encodeURIComponent(text)), 'search');
    }
  }

  // handle "add"
  function addToList() {
    var text;

    text = prompt('Enter text:');
    if(text) {
      makeRequest(g.addUrl, 'add', 'text='+encodeURIComponent(text));
    }
  }

  // handle "complete"
  function completeItem() {
    makeRequest(g.completeUrl, 'complete', 'id='+encodeURIComponent(this.id));
  }

  /* parse the returned document */
  function showList() {
    var elm, li, i, x;

    // fill in the list
    elm = document.getElementById('list-data');
    if(elm) {
      elm.innerHTML = '';
      for(i=0,x=g.msg.tasks.length;i<x;i++) {
        li = document.createElement('li');
        li.id = g.msg.tasks[i].id;
        li.appendChild(document.createTextNode(g.msg.tasks[i].text));
        li.title = 'click to delete';
        li.onclick = completeItem;

        elm.appendChild(li);
      }
    }
  }

  function initButtons() {
    var coll;

    coll = document.getElementsByTagName('input');
    for(i=0,x=coll.length;i<x;i++) {
      coll[i].onclick = clickButton;
    }
  }
  function clickButton() {

    switch(this.id) {
      case 'add':
        addToList();
        break;
      case 'search':
        searchList();
        break;
      case 'list':
        refreshList();
        break;
    }
  }

  // handle network request/response
  function makeRequest(href, context, body) {
    var ajax;

    ajax=new XMLHttpRequest();
    if(ajax) {

      ajax.onreadystatechange = function(){processResponse(ajax, context);};

      if(body) {
        ajax.open('post',href,false);
        ajax.send(body);
      }
      else {
        ajax.open('get',href,false);
        ajax.send(null);
      }
    }
  }
  function processResponse(ajax, context) {

    if(ajax.readyState==4 || ajax.readyState==='complete') {
      if(ajax.status===200 || ajax.status===204) {
        switch(context) {
          case 'list':
          case 'search':
            g.msg = JSON.parse(ajax.responseText);
            showList();
            break;
          case 'add':
          case 'complete':
            makeRequest(g.listUrl, 'list');
            break;
          default:
            alert('unknown context:'+context);
            break;
        }
      }
      else {
        alert('*** ERROR: '+ajax.status+'\n'+ajax.statusText);
      }
    }
  }

  var that = {};
  that.init = init;
  return that;
};
