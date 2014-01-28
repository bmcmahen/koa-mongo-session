/**
 * Module dependencies
 */

var debug = require('debug')('koa-mongo-session');
var url = require('url');
var Emitter = require('events').EventEmitter;
var inherit = require('util').inherits;
var monk = require('monk');
var wrap = require('co-monk');


/**
 * Module exports
 */

module.exports = MongoStore;


/**
 * Mongo Store Constructor
 * 
 * @param {Object} options 
 */

function MongoStore(options){
  if (!(this instanceof MongoStore)) return new MongoStore(options);
  Emitter.call(this);
  options = options || {};
  this.defaultExpirationTime = options.expiration || 1000 * 60 * 60 * 24 * 14;
  this.mongo = monk(options.mongo || 'localhost:27017/test');
  var session = this.mongo.get('sessions');
  this.collection = wrap(session);
  this.createIndexes();
}

inherit(MongoStore, Emitter);

/**
 * Attempt to create our indexes
 *  - expireAfterSeconds should remove our items
 *    immediately from db upon expiration.
 */

MongoStore.prototype.createIndexes = function *(){
  try {
    yield [
      this.collection.index('sid'),
      this.collection.index({'expires': 1}, { expireAfterSeconds: 0})
    ];
  } catch (err) {
    debug('error settings our indexes %s', err);
    return err;
  }
}

/**
 * Get our session.
 * 
 * @param {String} sid 
 */

MongoStore.prototype.get = function *(sid){
  debug('GET %s', sid);
  var data;
  try {
    data = yield this.collection.findOne({ _id: sid });
    
    if (!data) {
      debug('GET Empty');
      return null;
    }

    var session = JSON.parse(data.session);

    // determine if session has expired
    if (!data.expires || new Date < data.expires) {
      debug('Session has not expired %s', sid);
      return session;
    }

    // destroy if session has expired
    debug('Data has expired for %s', sid);
    yield this.destroy(sid);
    return null;
  } catch(err) {
    return err;
  }
};

/**
 * Set our session.
 * 
 * @param {String} sid 
 * @param {Object} session
 */

MongoStore.prototype.set = function *(sid, session){
  try {

    debug('SET %s %j', sid, session);
    session._sid = sid;

    var s = { 
      _id: sid, 
      session: JSON.stringify(session) 
    };

    if (session && session.cookie && session.cookie.expires) {
      debug('session cookie expires %s', session.cookie.expires);
      s.expires = new Date(session.cookie.expires);
    } else {
      var today = new Date();
      s.expires = new Date(today.getTime() + this.defaultExpirationTime);
      debug('creating new expiration %j', s);
    }
    yield this.collection.update({ _id : sid}, s, { upsert: true, safe: true });
  } catch (err) {
    debug('error setting store %s', err);
    return err;
  }
};

/**
 * Destroy our session.
 * 
 * @param {String} sid 
 */

MongoStore.prototype.destroy = function *(sid){
  try {
    yield this.collection.remove({ _id: sid });
  } catch (err) {
    return err;
  }
  debug('DEL %s', sid);
};

