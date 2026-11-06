/**
 * Import film scans for the Films page. Each sub-folder of <source> becomes a section,
 * titled with the folder name.
 *
 * For every photo it writes two JPEGs to public/images/films/<section>/:
 *   <name>.jpg        full-size, at least 1MB, high quality (opened in the lightbox)
 *   <name>-thumb.jpg  800px wide preview for the masonry grid
 * and rewrites src/data/films.json with the sections and photo sizes.
 *
 * Supports .bmp (24/32-bit uncompressed), .tif/.tiff, .jpg/.jpeg and .png.
 *
 * Usage:
 *   node scripts/import-films.mjs "C:\Users\meng\Pictures\Films\For Cabin2"
 */

import sharp from 'sharp';
import { readdir, readFile, writeFile, mkdir, rm, copyFile, stat } from 'node:fs/promises';
import { join, extname, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = join(ROOT, 'public', 'images', 'films');
const DATA_FILE = join(ROOT, 'src', 'data', 'films.json');

const MIN_FULL_BYTES = 1024 * 1024;
const FULL_LONG_EDGE = 3600;
const FULL_QUALITIES = [90, 93, 95];
const THUMB_WIDTH = 800;
const THUMB_QUALITY = 82;
const EXTENSIONS = new Set(['.bmp', '.tif', '.tiff', '.jpg', '.jpeg', '.png']);

const slugify = (s) =>
	s
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '') || 'photo';

/** Decode an uncompressed 24/32-bit BMP into a sharp instance (sharp cannot read BMP). */
function bmpToSharp(buf) {
	if (buf.toString('ascii', 0, 2) !== 'BM') throw new Error('not a BMP file');
	const pixelOffset = buf.readUInt32LE(10);
	const width = buf.readInt32LE(18);
	const rawHeight = buf.readInt32LE(22);
	const bpp = buf.readUInt16LE(28);
	const compression = buf.readUInt32LE(30);
	if (!(bpp === 24 && compression === 0) && !(bpp === 32 && (compression === 0 || compression === 3))) {
		throw new Error(`unsupported BMP (${bpp}-bit, compression ${compression})`);
	}

	const height = Math.abs(rawHeight);
	const bottomUp = rawHeight > 0;
	const bytesPerPixel = bpp / 8;
	const rowSize = Math.floor((bpp * width + 31) / 32) * 4;
	const rgb = Buffer.alloc(width * height * 3);

	for (let y = 0; y < height; y++) {
		const srcRow = pixelOffset + (bottomUp ? height - 1 - y : y) * rowSize;
		const dstRow = y * width * 3;
		for (let x = 0; x < width; x++) {
			const s = srcRow + x * bytesPerPixel;
			const d = dstRow + x * 3;
			rgb[d] = buf[s + 2];
			rgb[d + 1] = buf[s + 1];
			rgb[d + 2] = buf[s];
		}
	}

	return sharp(rgb, { raw: { width, height, channels: 3 } });
}

async function load(path) {
	const buf = await readFile(path);
	const image = extname(path).toLowerCase() === '.bmp' ? bmpToSharp(buf) : sharp(buf).rotate();
	// Materialise once so resizing twice doesn't decode the source twice
	const { data, info } = await image.toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
	return { data, info, sourceBytes: buf.length };
}

const fromRaw = ({ data, info }) =>
	sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });

async function writeFull(img, srcPath, dest) {
	const isJpeg = ['.jpg', '.jpeg'].includes(extname(srcPath).toLowerCase());
	// A small JPEG original can't be made better by re-encoding; keep it untouched
	if (isJpeg && img.sourceBytes <= MIN_FULL_BYTES) {
		await copyFile(srcPath, dest);
		return { bytes: img.sourceBytes, note: 'original kept (source under 1MB)' };
	}

	const attempts = [
		...FULL_QUALITIES.map((q) => ({ q, edge: FULL_LONG_EDGE })),
		{ q: 95, edge: null },
		{ q: 98, edge: null },
		{ q: 100, edge: null },
	];
	let out;
	for (const { q, edge } of attempts) {
		let pipeline = fromRaw(img);
		if (edge) pipeline = pipeline.resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true });
		out = await pipeline.jpeg({ quality: q, mozjpeg: true, chromaSubsampling: '4:4:4' }).toBuffer();
		if (out.length >= MIN_FULL_BYTES) break;
	}
	await writeFile(dest, out);
	return { bytes: out.length, note: out.length < MIN_FULL_BYTES ? 'under 1MB even at full size' : '' };
}

async function main() {
	const source = process.argv[2];
	if (!source) {
		console.error('Usage: node scripts/import-films.mjs <source-folder>');
		process.exit(1);
	}

	const folders = (await readdir(source, { withFileTypes: true }))
		.filter((d) => d.isDirectory())
		.map((d) => d.name)
		.sort((a, b) => a.localeCompare(b));

	await rm(OUT_DIR, { recursive: true, force: true });
	const sections = [];

	for (const folder of folders) {
		const slug = slugify(folder);
		const files = (await readdir(join(source, folder)))
			.filter((f) => EXTENSIONS.has(extname(f).toLowerCase()))
			.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
		if (files.length === 0) continue;

		await mkdir(join(OUT_DIR, slug), { recursive: true });
		const used = new Set();
		const photos = [];

		for (const file of files) {
			let name = slugify(basename(file, extname(file)));
			for (let n = 2; used.has(name); n++) name = `${slugify(basename(file, extname(file)))}-${n}`;
			used.add(name);

			const img = await load(join(source, folder, file));
			const full = await writeFull(img, join(source, folder, file), join(OUT_DIR, slug, `${name}.jpg`));
			const thumb = await fromRaw(img)
				.resize({ width: THUMB_WIDTH, withoutEnlargement: true })
				.jpeg({ quality: THUMB_QUALITY, mozjpeg: true })
				.toFile(join(OUT_DIR, slug, `${name}-thumb.jpg`));

			photos.push({
				full: `/images/films/${slug}/${name}.jpg`,
				thumb: `/images/films/${slug}/${name}-thumb.jpg`,
				width: thumb.width,
				height: thumb.height,
			});
			const mb = (full.bytes / 1024 / 1024).toFixed(1);
			console.log(`${folder}/${file} → ${mb}MB, thumb ${Math.round(thumb.size / 1024)}KB ${full.note}`);
		}

		sections.push({ title: folder, slug, photos });
	}

	await mkdir(dirname(DATA_FILE), { recursive: true });
	await writeFile(DATA_FILE, JSON.stringify({ sections }, null, '\t') + '\n');

	const total = sections.reduce((n, s) => n + s.photos.length, 0);
	let bytes = 0;
	for (const s of sections) for (const p of s.photos) bytes += (await stat(join(ROOT, 'public', p.full))).size;
	console.log(`Done: ${sections.length} sections, ${total} photos, full-size total ${Math.round(bytes / 1024 / 1024)}MB`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
