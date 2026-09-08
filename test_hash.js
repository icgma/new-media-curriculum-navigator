const crypto = require('crypto');
function hash(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}
console.log(hash('353f68dfa8f261e3511f6caa4afe9aeee3bfdfd007e408e46611dc9de4e15829'));
