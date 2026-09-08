const crypto = require('crypto');
const target = '353f68dfa8f261e3511f6caa4afe9aeee3bfdfd007e408e46611dc9de4e15829';

const words = [
    '31a27z2935', 'icgma2024', 'qcm2024', 'navigator2024',
    '353f68dfa8f261e3511f6caa4afe9aeee3bfdfd007e408e46611dc9de4e15829'
];

function hash(s) { return crypto.createHash('sha256').update(s).digest('hex'); }

for (let w of words) {
    if (hash(w) === target) console.log('Found:', w);
}
