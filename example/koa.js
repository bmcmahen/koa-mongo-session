var koa = require('koa');
var session = require('koa-sess');
var mongoStore = require('../');
var debug = require('debug')('koa-mongo-session');

var app = koa();

app.name = 'koa-mongo-session-test';
app.keys = ['keys', 'keykeys'];
app.use(session({ store: mongoStore() }));
app.proxy = true;

// app.use(function *() {
//   debug('middleware called');
//   this.session = this.session || {};
//   this.session.user = 'bento';
//   this.body = this.session;
// });


app.use(function *(){
  switch(this.request.url) {

    case '/':
      home(this);
      break;

    case '/session/get':
      get(this);
      break;

    case '/session/remove':
      remove(this);
      break;
  }
});

function get(ctx){
  ctx.session.count = ctx.session.count || 0;
  ctx.session.count++;
  ctx.body = ctx.session.count;
  debug('this session %j', ctx.session);
}

function remove(ctx){
  ctx.session = null;
  ctx.body = 0;
}

function home(ctx){
  ctx.body = ctx.session;
}

require('http').createServer(app.callback()).listen(8080);
console.log('server started at 8080');