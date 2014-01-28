## koa-mongo-session

mongo-db session management for `koa` and `koa-sess`.

## Example

```javascript
var koa = require('koa');
var session = require('koa-sess');
var mongoStore = require('koa-mongo-session');

var app = koa();

app.use(session({ store: mongoStore() }));

app.use(function* (){
  this.session.count = this.session.count || 0;
  this.session.count++;
  this.body = this.session.count;
});
```

## Install

```
$ npm install koa-mongo-session
```

## License

MIT