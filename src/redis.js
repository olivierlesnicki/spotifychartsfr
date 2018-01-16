const redis = require("redis");
const { REDIS_URL } = process.env;

const client = redis.createClient(REDIS_URL);

module.exports = {
  set: (key, value) =>
    new Promise((resolve, reject) => {
      client.set(key, value, err => {
        if (err) return reject(err);
        resolve();
      });
    }),
  get: key =>
    new Promise((resolve, reject) => {
      client.get(key, (err, value) => {
        if (err) return reject(err);
        resolve(value);
      });
    }),
  quit: () => client.quit()
};
