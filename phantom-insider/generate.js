/**
 * Phantom Insider — Static File Generator
 * 
 * Generates the dynamic evidence files for the OSINT lab:
 *   - meetup_spot.jpg  (JPEG with Flag 2 embedded in EXIF ImageDescription)
 *   - stolen_data.zip  (Password-protected ZIP containing Flag 3)
 * 
 * Usage: node phantom-insider/generate.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');

const STATIC_DIR = path.join(__dirname, 'static');
const FLAG_2 = 'PI{exif_geolocation_extracted}';
const FLAG_3 = 'PI{archive_decrypted_data_recovered}';
const ZIP_PASSWORD = 'liverpool123';

// ── Generate meetup_spot.jpg with EXIF ──────────────────────────
async function generateMeetupImage() {
    console.log('[*] Generating meetup_spot.jpg with EXIF data...');

    const basePath = path.join(__dirname, 'meetup_base.png');
    const outPath = path.join(STATIC_DIR, 'meetup_spot.jpg');

    // Build EXIF APP1 segment with the flag in ImageDescription
    const flagBytes = Buffer.from(FLAG_2, 'utf-8');
    const tiffHeader = Buffer.from([0x49, 0x49, 0x2A, 0x00, 0x08, 0x00, 0x00, 0x00]);
    const ifdCount = Buffer.from([0x01, 0x00]);
    const ifdEntry = Buffer.alloc(12);
    ifdEntry.writeUInt16LE(0x010E, 0);          // Tag: ImageDescription
    ifdEntry.writeUInt16LE(0x0002, 2);          // Type: ASCII
    ifdEntry.writeUInt32LE(flagBytes.length + 1, 4);
    ifdEntry.writeUInt32LE(8 + 2 + 12 + 4, 8); // Offset to string data
    const nextIfd = Buffer.from([0x00, 0x00, 0x00, 0x00]);
    const flagData = Buffer.concat([flagBytes, Buffer.from([0x00])]);
    const tiffData = Buffer.concat([tiffHeader, ifdCount, ifdEntry, nextIfd, flagData]);
    const exifHeader = Buffer.from('457869660000', 'hex');
    const app1Payload = Buffer.concat([exifHeader, tiffData]);
    const app1Length = Buffer.alloc(2);
    app1Length.writeUInt16BE(app1Payload.length + 2, 0);
    const app1Segment = Buffer.concat([Buffer.from([0xFF, 0xE1]), app1Length, app1Payload]);

    // Convert PNG → JPEG using sharp
    let jpegBuf;
    try {
        const sharp = require('sharp');
        jpegBuf = await sharp(basePath).jpeg({ quality: 85 }).toBuffer();
        console.log(`[+] PNG converted to JPEG (${jpegBuf.length} bytes)`);
    } catch (e) {
        console.warn(`[!] sharp conversion failed: ${e.message}`);
        if (fs.existsSync(basePath)) {
            fs.copyFileSync(basePath, outPath);
            console.log(`[+] meetup_spot.jpg created as PNG copy (no EXIF)`);
            return;
        }
    }

    // Inject EXIF into JPEG — insert APP1 right after SOI (FF D8)
    if (jpegBuf && jpegBuf[0] === 0xFF && jpegBuf[1] === 0xD8) {
        let insertPos = 2;
        // Skip APP0 (JFIF) if present
        if (jpegBuf[2] === 0xFF && jpegBuf[3] === 0xE0) {
            insertPos = 2 + 2 + jpegBuf.readUInt16BE(4);
        }
        const outputJpeg = Buffer.concat([
            jpegBuf.slice(0, 2),
            app1Segment,
            jpegBuf.slice(insertPos)
        ]);
        fs.writeFileSync(outPath, outputJpeg);
        console.log(`[+] meetup_spot.jpg created (${outputJpeg.length} bytes, EXIF flag injected)`);
    }
}

// ── ZipCrypto Implementation (Traditional PKZIP encryption) ────
// This creates a real password-protected ZIP that standard tools can extract.
class ZipCrypto {
    constructor(password) {
        this.keys = [0x12345678, 0x23456789, 0x34567890];
        const pwBuf = Buffer.from(password, 'utf-8');
        for (let i = 0; i < pwBuf.length; i++) {
            this._updateKeys(pwBuf[i]);
        }
    }

    _crc32Update(crc, byte) {
        return (ZipCrypto.CRC_TABLE[(crc ^ byte) & 0xFF] ^ (crc >>> 8)) >>> 0;
    }

    _updateKeys(byte) {
        this.keys[0] = this._crc32Update(this.keys[0], byte);
        this.keys[1] = ((this.keys[1] + (this.keys[0] & 0xFF)) >>> 0);
        this.keys[1] = ((Math.imul(this.keys[1], 134775813) + 1) & 0xFFFFFFFF) >>> 0;
        this.keys[2] = this._crc32Update(this.keys[2], (this.keys[1] >>> 24) & 0xFF);
    }

    _decryptByte() {
        const temp = (this.keys[2] | 2) & 0xFFFF;
        return ((Math.imul(temp, (temp ^ 1)) >>> 8) & 0xFF);
    }

    encrypt(data) {
        const result = Buffer.alloc(data.length);
        for (let i = 0; i < data.length; i++) {
            const k = this._decryptByte();
            result[i] = (data[i] ^ k) & 0xFF;
            this._updateKeys(data[i]);
        }
        return result;
    }
}

// Pre-compute CRC32 table
ZipCrypto.CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    ZipCrypto.CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) {
        crc = (ZipCrypto.CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)) >>> 0;
    }
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function generateStolenZip() {
    console.log('[*] Generating stolen_data.zip (password-protected)...');

    const fileName = 'flag3.txt';
    const fileContent = Buffer.from(
        `Excellent work, operative. You cracked the hash and extracted the archive.\n\nFinal Flag: ${FLAG_3}\n`
    );

    const fileCrc = crc32(fileContent);
    const deflated = zlib.deflateRawSync(fileContent);

    // Encryption header (12 bytes random, last byte = high byte of CRC)
    const encHeader = crypto.randomBytes(12);
    encHeader[11] = (fileCrc >>> 24) & 0xFF;

    // Encrypt: header + deflated data
    const zipcrypto = new ZipCrypto(ZIP_PASSWORD);
    const encryptedHeader = zipcrypto.encrypt(encHeader);
    const encryptedData = zipcrypto.encrypt(deflated);
    const encryptedPayload = Buffer.concat([encryptedHeader, encryptedData]);

    const fileNameBuf = Buffer.from(fileName, 'utf-8');
    const now = new Date();
    const dosTime = ((now.getSeconds() >> 1) | (now.getMinutes() << 5) | (now.getHours() << 11)) & 0xFFFF;
    const dosDate = (now.getDate() | ((now.getMonth() + 1) << 5) | ((now.getFullYear() - 1980) << 9)) & 0xFFFF;

    // Local file header
    const localHeader = Buffer.alloc(30 + fileNameBuf.length);
    localHeader.writeUInt32LE(0x04034B50, 0);   // Signature
    localHeader.writeUInt16LE(20, 4);            // Version needed
    localHeader.writeUInt16LE(0x0001, 6);        // General purpose bit flag (encrypted)
    localHeader.writeUInt16LE(8, 8);             // Compression: deflate
    localHeader.writeUInt16LE(dosTime, 10);
    localHeader.writeUInt16LE(dosDate, 12);
    localHeader.writeUInt32LE(fileCrc, 14);
    localHeader.writeUInt32LE(encryptedPayload.length, 18);  // Compressed size (includes 12-byte header)
    localHeader.writeUInt32LE(fileContent.length, 22);       // Uncompressed size
    localHeader.writeUInt16LE(fileNameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);            // Extra field length
    fileNameBuf.copy(localHeader, 30);

    // Central directory header
    const centralDir = Buffer.alloc(46 + fileNameBuf.length);
    centralDir.writeUInt32LE(0x02014B50, 0);     // Signature
    centralDir.writeUInt16LE(20, 4);             // Version made by
    centralDir.writeUInt16LE(20, 6);             // Version needed
    centralDir.writeUInt16LE(0x0001, 8);         // Flags (encrypted)
    centralDir.writeUInt16LE(8, 10);             // Compression
    centralDir.writeUInt16LE(dosTime, 12);
    centralDir.writeUInt16LE(dosDate, 14);
    centralDir.writeUInt32LE(fileCrc, 16);
    centralDir.writeUInt32LE(encryptedPayload.length, 20);
    centralDir.writeUInt32LE(fileContent.length, 24);
    centralDir.writeUInt16LE(fileNameBuf.length, 28);
    centralDir.writeUInt16LE(0, 30);             // Extra field length
    centralDir.writeUInt16LE(0, 32);             // File comment length
    centralDir.writeUInt16LE(0, 34);             // Disk number start
    centralDir.writeUInt16LE(0, 36);             // Internal attributes
    centralDir.writeUInt32LE(0, 38);             // External attributes
    centralDir.writeUInt32LE(0, 42);             // Offset of local header
    fileNameBuf.copy(centralDir, 46);

    // End of central directory
    const centralDirOffset = localHeader.length + encryptedPayload.length;
    const endOfCentralDir = Buffer.alloc(22);
    endOfCentralDir.writeUInt32LE(0x06054B50, 0);
    endOfCentralDir.writeUInt16LE(0, 4);         // Disk number
    endOfCentralDir.writeUInt16LE(0, 6);         // Central dir disk
    endOfCentralDir.writeUInt16LE(1, 8);         // Entries on disk
    endOfCentralDir.writeUInt16LE(1, 10);        // Total entries
    endOfCentralDir.writeUInt32LE(centralDir.length, 12);
    endOfCentralDir.writeUInt32LE(centralDirOffset, 16);
    endOfCentralDir.writeUInt16LE(0, 20);        // Comment length

    const zipData = Buffer.concat([localHeader, encryptedPayload, centralDir, endOfCentralDir]);

    fs.writeFileSync(path.join(STATIC_DIR, 'stolen_data.zip'), zipData);
    console.log(`[+] stolen_data.zip created (${zipData.length} bytes, password: ${ZIP_PASSWORD})`);
}

// ── Main ────────────────────────────────────────────────────────
async function main() {
    console.log('=== Phantom Insider — Static File Generator ===\n');
    fs.mkdirSync(STATIC_DIR, { recursive: true });

    await generateMeetupImage();
    generateStolenZip();

    console.log('\n[✓] Generation complete!');
    console.log(`    Evidence files: ${STATIC_DIR}`);
}

main();
