"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.pcmToWav = pcmToWav;
function pcmToWav(pcm, { sampleRate, channels, bitDepth }) {
    const blockAlign = (channels * bitDepth) / 8;
    const byteRate = sampleRate * blockAlign;
    const header = Buffer.alloc(44);
    header.write('RIFF', 0, 'ascii');
    header.writeUInt32LE(36 + pcm.length, 4); // total file size minus the 8 bytes for 'RIFF' + this field
    header.write('WAVE', 8, 'ascii');
    header.write('fmt ', 12, 'ascii');
    header.writeUInt32LE(16, 16); // fmt chunk size (16 for PCM)
    header.writeUInt16LE(1, 20); // audio format: 1 = uncompressed PCM
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write('data', 36, 'ascii');
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
}
//# sourceMappingURL=wav.js.map