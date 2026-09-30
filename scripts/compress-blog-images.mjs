/**
 * Compress blog images in place: max width 1080px, JPEG quality 80 (mozjpeg).
 * A file is only overwritten when the result is smaller.
 *
 * Usage:
 *   node scripts/compress-blog-images.mjs <dir> [dir2 ...]
 *   node scripts/compress-blog-images.mjs public/images/blog/490630859
 */

import sharp from 'sharp';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, extname } from 'node:path';

const MAX_WIDTH = 1080;
const JPEG_QUALITY = 80;
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

async function compressFile(path) {
	const input = await readFile(path);
	const ext = extname(path).toLowerCase();

	let pipeline = sharp(input).rotate().resize({ width: MAX_WIDTH, withoutEnlargement: true });
	if (ext === '.png') {
		pipeline = pipeline.png({ compressionLevel: 9, palette: true });
	} else if (ext === '.webp') {
		pipeline = pipeline.webp({ quality: JPEG_QUALITY });
	} else {
		pipeline = pipeline.jpeg({ quality: JPEG_QUALITY, mozjpeg: true });
	}

	const output = await pipeline.toBuffer();
	if (output.length >= input.length) {
		return { before: input.length, after: input.length };
	}

	await writeFile(path, output);
	return { before: input.length, after: output.length };
}

async function main() {
	const dirs = process.argv.slice(2);
	if (dirs.length === 0) {
		console.error('Usage: node scripts/compress-blog-images.mjs <dir> [dir2 ...]');
		process.exit(1);
	}

	let totalBefore = 0;
	let totalAfter = 0;

	for (const dir of dirs) {
		const files = (await readdir(dir)).filter((f) => EXTENSIONS.has(extname(f).toLowerCase()));
		for (const file of files) {
			const { before, after } = await compressFile(join(dir, file));
			totalBefore += before;
			totalAfter += after;
		}
		console.log(`${dir}: ${files.length} files`);
	}

	const kb = (n) => `${Math.round(n / 1024)}KB`;
	console.log(`Total: ${kb(totalBefore)} → ${kb(totalAfter)}`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
