const crypto = require('crypto');
const target = '353f68dfa8f261e3511f6caa4afe9aeee3bfdfd007e408e46611dc9de4e15829';

const words = ['31a27z2935', 'admin', 'password', '123456', 'nmn', 'icgma', 'stu', 'stou', 'newmedia', 'qcm2024', 'qcm', 'curriculum', '2024', '2024-2026', 'navigator'];

function hash(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

for (let w of words) {
    if (hash(w) === target) console.log('Found:', w);
}
