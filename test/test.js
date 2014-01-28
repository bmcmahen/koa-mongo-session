/**
 * Module dependencies.
 */

var assert = require('assert');
var co = require('co');

describe('MongoStore', function(){

  var store;

  it('should be constructed', function(done){
    store = require('../')();
    assert(store.collection);
    assert(store.mongo);
    done();
  });

  it('should set sessions', function(done){
    co(function *(){
      yield store.set('key', { a : 1 });
      var v = yield store.get('key');
      assert(v.a === 1);
      done();
    })();
  });

  it('should destroy sessions', function(done){
    co(function *(){
      yield store.destroy('key');
      var v = yield store.get('key');
      assert(!v);
      done();
    })();
  });

  it('should set with cookie expires', function(done){
    co(function *(){
      var t = new Date();
      t.setSeconds(t.getSeconds() + 1);
      yield store.set('key', {a : 1, cookie: {expires: t }});
      var v = yield store.get('key');
      assert(new Date(v.cookie.expires).getTime() == t.getTime());
      done();
    })();
  });

  it('should now expire after 2 seconds', function(done){
    co(function *(){

      function sleep(t) {
        return function (done) {
          setTimeout(done, t);
        }
      }

      yield sleep(1500);
      var v = yield store.get('key');
      assert(!v);
      done();
    })();
  });

});
