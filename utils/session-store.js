const mongoose = require("mongoose");
const session = require("express-session");

// Sessions kept in MongoDB, so a restart doesn't sign everyone out. Each
// one is removed by Mongo itself once it expires (the TTL index)
const Session = mongoose.model(
  "Session",
  new mongoose.Schema({
    _id: String,
    data: String,
    expires: { type: Date, index: { expires: 0 } },
  })
);

const DEFAULT_AGE = 24 * 60 * 60 * 1000;

const expiresOf = (sess) =>
  new Date(sess?.cookie?.expires || Date.now() + DEFAULT_AGE);

class MongoStore extends session.Store {
  get(sid, cb) {
    Session.findById(sid)
      .lean()
      .then((doc) => {
        if (!doc || doc.expires < new Date()) return cb(null, null);
        cb(null, JSON.parse(doc.data));
      })
      .catch(cb);
  }

  set(sid, sess, cb) {
    Session.updateOne(
      { _id: sid },
      { data: JSON.stringify(sess), expires: expiresOf(sess) },
      { upsert: true }
    )
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }

  touch(sid, sess, cb) {
    Session.updateOne({ _id: sid }, { expires: expiresOf(sess) })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }

  destroy(sid, cb) {
    Session.deleteOne({ _id: sid })
      .then(() => cb?.())
      .catch((err) => cb?.(err));
  }
}

module.exports = MongoStore;
