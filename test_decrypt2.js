const fs = require('fs');
const crypto = require('crypto').webcrypto;

async function decryptData(encryptedBuffer, password) {
    const PBKDF2_ITERATIONS = 100000;
    const data = new Uint8Array(encryptedBuffer);
    const salt = data.slice(0, 16);
    const iv = data.slice(16, 32);
    const ciphertext = data.slice(32);

    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    );
    const aesKey = await crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-CBC', length: 256 },
        false,
        ['decrypt']
    );
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-CBC', iv },
        aesKey,
        ciphertext
    );
    return new TextDecoder().decode(decrypted);
}

async function main() {
    const b64Text = fs.readFileSync('curriculum_data_real.json.enc', 'utf8').trim();
    const binaryStr = atob(b64Text);
    const encBuf = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        encBuf[i] = binaryStr.charCodeAt(i);
    }
    
    try {
        const jsonStr = await decryptData(encBuf.buffer, '31a27z2935');
        console.log(jsonStr.substring(0, 500));
    } catch (e) {
        console.error('Failed to decrypt with 31a27z2935:', e);
    }
}

main();
