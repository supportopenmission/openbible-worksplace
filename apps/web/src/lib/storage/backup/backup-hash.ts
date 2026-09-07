const ROUND_CONSTANTS = new Uint32Array([
	0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
	0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
	0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
	0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
	0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
	0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
	0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
	0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

const INITIAL_STATE = new Uint32Array([
	0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
	0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
]);

function rotateRight(value: number, bits: number): number {
	return (value >>> bits) | (value << (32 - bits));
}

function choice(x: number, y: number, z: number): number {
	return (x & y) ^ (~x & z);
}

function majority(x: number, y: number, z: number): number {
	return (x & y) ^ (x & z) ^ (y & z);
}

function upperSigma0(value: number): number {
	return rotateRight(value, 2) ^ rotateRight(value, 13) ^ rotateRight(value, 22);
}

function upperSigma1(value: number): number {
	return rotateRight(value, 6) ^ rotateRight(value, 11) ^ rotateRight(value, 25);
}

function lowerSigma0(value: number): number {
	return rotateRight(value, 7) ^ rotateRight(value, 18) ^ (value >>> 3);
}

function lowerSigma1(value: number): number {
	return rotateRight(value, 17) ^ rotateRight(value, 19) ^ (value >>> 10);
}

function toHex(value: number): string {
	return value.toString(16).padStart(8, '0');
}

export class IncrementalSha256 {
	private state = new Uint32Array(INITIAL_STATE);
	private buffer = new Uint8Array(64);
	private bufferLength = 0;
	private totalBytes = 0;

	update(chunk: Uint8Array): this {
		if (chunk.byteLength === 0) return this;
		this.totalBytes += chunk.byteLength;
		let offset = 0;

		if (this.bufferLength > 0) {
			const needed = 64 - this.bufferLength;
			const copied = Math.min(needed, chunk.byteLength);
			this.buffer.set(chunk.subarray(0, copied), this.bufferLength);
			this.bufferLength += copied;
			offset += copied;
			if (this.bufferLength === 64) {
				this.processBlock(this.buffer);
				this.bufferLength = 0;
			}
		}

		while (offset + 64 <= chunk.byteLength) {
			this.processBlock(chunk.subarray(offset, offset + 64));
			offset += 64;
		}

		if (offset < chunk.byteLength) {
			this.buffer.set(chunk.subarray(offset), 0);
			this.bufferLength = chunk.byteLength - offset;
		}
		return this;
	}

	digest(): string {
		const copy = new IncrementalSha256();
		copy.state.set(this.state);
		copy.buffer.set(this.buffer);
		copy.bufferLength = this.bufferLength;
		copy.totalBytes = this.totalBytes;

		copy.buffer[copy.bufferLength] = 0x80;
		copy.bufferLength += 1;
		if (copy.bufferLength > 56) {
			copy.buffer.fill(0, copy.bufferLength);
			copy.processBlock(copy.buffer);
			copy.bufferLength = 0;
		}
		copy.buffer.fill(0, copy.bufferLength, 56);

		const bitLength = copy.totalBytes * 8;
		const high = Math.floor(bitLength / 0x100000000);
		const low = bitLength >>> 0;
		const view = new DataView(copy.buffer.buffer);
		view.setUint32(56, high >>> 0, false);
		view.setUint32(60, low, false);
		copy.processBlock(copy.buffer);

		return [...copy.state].map(toHex).join('');
	}

	private processBlock(block: Uint8Array): void {
		const words = new Uint32Array(64);
		for (let index = 0; index < 16; index += 1) {
			const offset = index * 4;
			words[index] =
				(block[offset] << 24) |
				(block[offset + 1] << 16) |
				(block[offset + 2] << 8) |
				block[offset + 3];
		}
		for (let index = 16; index < 64; index += 1) {
			words[index] =
				(lowerSigma1(words[index - 2]) + words[index - 7] + lowerSigma0(words[index - 15]) + words[index - 16]) >>> 0;
		}

		let [a, b, c, d, e, f, g, h] = this.state;
		for (let index = 0; index < 64; index += 1) {
			const temporary1 = (h + upperSigma1(e) + choice(e, f, g) + ROUND_CONSTANTS[index] + words[index]) >>> 0;
			const temporary2 = (upperSigma0(a) + majority(a, b, c)) >>> 0;
			h = g;
			g = f;
			f = e;
			e = (d + temporary1) >>> 0;
			d = c;
			c = b;
			b = a;
			a = (temporary1 + temporary2) >>> 0;
		}

		this.state[0] = (this.state[0] + a) >>> 0;
		this.state[1] = (this.state[1] + b) >>> 0;
		this.state[2] = (this.state[2] + c) >>> 0;
		this.state[3] = (this.state[3] + d) >>> 0;
		this.state[4] = (this.state[4] + e) >>> 0;
		this.state[5] = (this.state[5] + f) >>> 0;
		this.state[6] = (this.state[6] + g) >>> 0;
		this.state[7] = (this.state[7] + h) >>> 0;
	}
}

export function createIncrementalSha256(): IncrementalSha256 {
	return new IncrementalSha256();
}

export async function hashSha256(chunks: AsyncIterable<Uint8Array>): Promise<string> {
	const hasher = createIncrementalSha256();
	for await (const chunk of chunks) hasher.update(chunk);
	return hasher.digest();
}
