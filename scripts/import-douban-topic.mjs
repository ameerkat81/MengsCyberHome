/**
 * Import Douban group topics into src/content/blog/*.md
 *
 * Usage:
 *   DOUBAN_COOKIE="..." node scripts/import-douban-topic.mjs <url> [url2 ...]
 *   DOUBAN_COOKIE="..." node scripts/import-douban-topic.mjs --file scripts/douban-urls.txt
 *   DOUBAN_COOKIE="..." node scripts/import-douban-topic.mjs --file urls.txt --force
 */

import * as cheerio from 'cheerio';
import { writeFile, mkdir, readFile, readdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, '../src/content/blog');
const IMAGES_DIR = join(__dirname, '../public/images/blog');
const REQUEST_DELAY_MS = 1500;
const IMAGE_DELAY_MS = 300;

const USER_AGENT =
	'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const DOUBAN_IMAGE_MD_RE =
	/!\[([^\]]*)\]\((https?:\/\/img\d*\.doubanio\.com\/[^)\s]+)\)/g;

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv) {
	const args = argv.slice(2);
	let force = false;
	let filePath = null;
	const urls = [];

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		if (arg === '--force') {
			force = true;
		} else if (arg === '--file') {
			filePath = args[++i];
			if (!filePath) {
				throw new Error('--file requires a path argument');
			}
		} else if (arg.startsWith('-')) {
			throw new Error(`Unknown option: ${arg}`);
		} else {
			urls.push(arg);
		}
	}

	return { force, filePath, urls };
}

async function readUrlsFromFile(filePath) {
	const text = await readFile(filePath, 'utf8');
	return text
		.split('\n')
		.map((line) => line.trim())
		.filter((line) => line && !line.startsWith('#'));
}

function normalizeTopicUrl(input) {
	const match = input.match(/topic\/(\d+)/);
	if (!match) {
		throw new Error(`Invalid Douban topic URL: ${input}`);
	}

	const topicId = match[1];
	const trimmed = input.trim().replace(/\/+$/, '');
	const hasOrigin = /^https?:\/\//.test(trimmed);

	const fetchUrls = [];
	if (hasOrigin) {
		fetchUrls.push(`${trimmed}/`);
	}
	fetchUrls.push(`https://www.douban.com/topic/${topicId}/`);
	fetchUrls.push(`https://www.douban.com/group/topic/${topicId}/`);

	const uniqueFetchUrls = [...new Set(fetchUrls)];

	return {
		topicId,
		sourceUrl: hasOrigin ? `${trimmed}/` : `https://www.douban.com/topic/${topicId}/`,
		fetchUrls: uniqueFetchUrls,
	};
}

async function loadExistingTopicIds() {
	const ids = new Map();

	try {
		const files = await readdir(BLOG_DIR);
		for (const file of files) {
			if (!file.endsWith('.md') && !file.endsWith('.mdx')) continue;
			const content = await readFile(join(BLOG_DIR, file), 'utf8');
			const urlMatch = content.match(/sourceUrl:\s*"(.*?)"/);
			if (!urlMatch) continue;
			const topicMatch = urlMatch[1].match(/topic\/(\d+)/);
			if (topicMatch) {
				ids.set(topicMatch[1], join(BLOG_DIR, file));
			}
		}
	} catch (err) {
		if (err.code !== 'ENOENT') throw err;
	}

	return ids;
}

function slugify(text, fallback) {
	const slug = text
		.toLowerCase()
		.replace(/[^\w\u4e00-\u9fff]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 60);
	return slug || fallback;
}

function parseDoubanDate(text) {
	if (!text) return null;

	const isoMatch = text.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (isoMatch) {
		const [, y, m, d] = isoMatch;
		return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
	}

	const cnMatch = text.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
	if (cnMatch) {
		const [, y, m, d] = cnMatch;
		return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
	}

	return null;
}

function escapeYamlString(value) {
	return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function stripSeriesNav(markdown) {
	let result = markdown;

	// Douban prev/next links, often multiline with a preview ending in 转载自
	result = result.replace(
		/(?:^|\n|\s)(?:接上文|接上篇|上一篇|下一篇)[：:]\s*\[[\s\S]*?\]\(\s*https?:\/\/www\.douban\.com\/topic\/\d+[^)]*\)/g,
		(m) => (m.startsWith('\n') ? '\n' : ''),
	);

	// Trailing "to be continued" blocks that introduce the next post
	result = result.replace(/\n?\s*未完待续[…\.]+[\s\S]*$/u, '');

	// Orphan nav labels
	result = result.replace(/^(?:上一篇|下一篇)[：:]\s*$/gm, '');
	result = result.replace(/\n-{2,}\s*$/g, '');

	return result.replace(/\n{3,}/g, '\n\n').trim();
}

function htmlToMarkdown($, element) {
	const lines = [];

	function walk(node) {
		if (node.type === 'text') {
			const text = (node.data ?? '').replace(/\s+/g, ' ');
			if (text.trim()) lines.push(text.trim());
			return;
		}

		if (node.type !== 'tag') return;

		const tag = node.tagName?.toLowerCase();
		const $el = $(node);

		if (tag === 'br') {
			lines.push('');
			return;
		}

		if (/^h[1-6]$/.test(tag)) {
			const level = Math.min(Number(tag[1]) + 1, 6);
			const text = $el.text().trim();
			if (text) {
				lines.push(`${'#'.repeat(level)} ${text}`);
				lines.push('');
			}
			return;
		}

		if (tag === 'strong' || tag === 'b') {
			const text = $el.text().trim();
			if (text) {
				lines.push(`**${text}**`);
			}
			return;
		}

		if (tag === 'img') {
			const src = $el.attr('src') || $el.attr('data-src') || '';
			const alt = $el.attr('alt') || '';
			if (src) {
				lines.push(`![${alt}](${src})`);
				lines.push('');
			}
			return;
		}

		if (tag === 'a') {
			const href = $el.attr('href') || '';
			const text = $el.text().trim();
			if (href && text) {
				lines.push(`[${text}](${href})`);
			} else if (text) {
				lines.push(text);
			}
			return;
		}

		if (tag === 'p' || tag === 'div') {
			const textBuf = [];

			function flushText() {
				const text = textBuf.join(' ').replace(/\s+/g, ' ').trim();
				textBuf.length = 0;
				if (text) lines.push(text);
			}

			for (const child of $el.contents().toArray()) {
				if (child.type === 'text') {
					textBuf.push((child.data ?? '').replace(/\s+/g, ' '));
					continue;
				}

				if (child.type !== 'tag') continue;

				const childTag = child.tagName?.toLowerCase();
				const $child = $(child);

				if (childTag === 'br') {
					flushText();
					continue;
				}

				if (childTag === 'img') {
					flushText();
					const src = $child.attr('src') || $child.attr('data-src') || '';
					const alt = $child.attr('alt') || '';
					if (src) lines.push(`![${alt}](${src})`);
					continue;
				}

				if (childTag === 'a') {
					const href = $child.attr('href') || '';
					const text = $child.text().trim();
					if (href && text) {
						textBuf.push(`[${text}](${href})`);
					} else if (text) {
						textBuf.push(text);
					}
					continue;
				}

				flushText();
				walk(child);
			}

			flushText();
			if (lines.length > 0 && lines.at(-1) !== '') {
				lines.push('');
			}
			return;
		}

		if (tag === 'blockquote') {
			const text = $el.text().trim();
			if (text) {
				for (const line of text.split('\n')) {
					lines.push(`> ${line.trim()}`);
				}
				lines.push('');
			}
			return;
		}

		for (const child of $el.contents().toArray()) {
			walk(child);
		}
	}

	for (const child of $(element).contents().toArray()) {
		walk(child);
	}

	return lines
		.join('\n')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

function extractTitle($) {
	const h1 = $('h1').first().text().trim();
	if (h1) return h1;

	const titleTag = $('title').text().trim();
	if (titleTag) {
		return titleTag.replace(/\s*-\s*豆瓣.*$/, '').trim();
	}

	throw new Error('Could not extract topic title from page');
}

function extractDate($) {
	const selectors = ['.create-time', '.topic-meta .create-time', 'span.create-time'];
	for (const sel of selectors) {
		const text = $(sel).first().text().trim();
		const parsed = parseDoubanDate(text);
		if (parsed) return parsed;
	}

	const meta = $('meta[property="article:published_time"]').attr('content');
	if (meta) {
		const parsed = parseDoubanDate(meta);
		if (parsed) return parsed;
	}

	return new Date().toISOString().slice(0, 10);
}

function extractContent($) {
	const selectors = [
		'div.topic-content',
		'.topic-content',
		'#link-report .topic-content',
		'.topic-doc .topic-content',
	];

	for (const sel of selectors) {
		const el = $(sel).first();
		if (el.length) {
			const md = htmlToMarkdown($, el);
			if (md) return md;
		}
	}

	throw new Error(
		'Could not extract topic content. The page may require login — set DOUBAN_COOKIE.',
	);
}

async function fetchTopicPage(urls, cookie) {
	const headers = {
		'User-Agent': USER_AGENT,
		Accept: 'text/html,application/xhtml+xml',
		'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
	};

	if (cookie) {
		headers.Cookie = cookie;
	}

	let lastError = null;

	for (const url of urls) {
		const response = await fetch(url, { headers, redirect: 'follow' });
		const html = await response.text();

		if (
			html.includes('sec.douban.com') ||
			html.includes('验证码') ||
			html.includes('captcha')
		) {
			throw new Error(
				'Douban returned a captcha or security page. Provide a valid DOUBAN_COOKIE from a logged-in browser.',
			);
		}

		if (response.status === 403 || html.includes('没有访问权限')) {
			throw new Error(
				'Access denied (403). This topic may be private — set DOUBAN_COOKIE from a logged-in browser.',
			);
		}

		if (!response.ok) {
			lastError = new Error(`HTTP ${response.status} fetching ${url}`);
			continue;
		}

		return { html, resolvedUrl: response.url || url };
	}

	throw lastError ?? new Error('Could not fetch topic from any URL variant');
}

function imageFilenameFromUrl(url) {
	const match = url.match(/\/([^/?#]+\.(?:jpe?g|png|gif|webp))(?:\?|$)/i);
	if (match) return match[1];
	const fallback = url.split('/').pop()?.split('?')[0];
	if (fallback) return fallback;
	throw new Error(`Could not derive filename from image URL: ${url}`);
}

async function downloadImage(url, destPath, cookie) {
	const headers = {
		'User-Agent': USER_AGENT,
		Referer: 'https://www.douban.com/',
		Accept: 'image/*',
	};

	if (cookie) {
		headers.Cookie = cookie;
	}

	const response = await fetch(url, { headers, redirect: 'follow' });
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} downloading ${url}`);
	}

	const buffer = Buffer.from(await response.arrayBuffer());
	await writeFile(destPath, buffer);
}

async function localizeImages(markdown, topicId, cookie) {
	const imageDir = join(IMAGES_DIR, topicId);
	await mkdir(imageDir, { recursive: true });

	const replacements = new Map();
	const matches = [...markdown.matchAll(DOUBAN_IMAGE_MD_RE)];

	for (const [, alt, url] of matches) {
		if (replacements.has(url)) continue;

		const filename = imageFilenameFromUrl(url);
		const destPath = join(imageDir, filename);
		const publicPath = `/images/blog/${topicId}/${filename}`;

		await downloadImage(url, destPath, cookie);
		replacements.set(url, { alt, publicPath });
		console.log(`      image → ${publicPath}`);

		if (IMAGE_DELAY_MS > 0) {
			await sleep(IMAGE_DELAY_MS);
		}
	}

	let result = markdown;
	for (const [url, { alt, publicPath }] of replacements) {
		result = result.replaceAll(`![${alt}](${url})`, `![${alt}](${publicPath})`);
	}

	// Replace any remaining douban images (alt text may differ)
	result = result.replace(DOUBAN_IMAGE_MD_RE, (full, alt, url) => {
		const mapped = replacements.get(url);
		return mapped ? `![${alt}](${mapped.publicPath})` : full;
	});

	return { body: result, imageCount: replacements.size };
}

async function importTopic(inputUrl, cookie, existingTopicIds, force) {
	const { topicId, sourceUrl, fetchUrls } = normalizeTopicUrl(inputUrl);

	if (!force && existingTopicIds.has(topicId)) {
		return {
			status: 'SKIP',
			topicId,
			url: sourceUrl,
			reason: `already imported (${existingTopicIds.get(topicId)})`,
		};
	}

	const { html, resolvedUrl } = await fetchTopicPage(fetchUrls, cookie);
	const $ = cheerio.load(html);

	const title = extractTitle($);
	const date = extractDate($);
	let body = stripSeriesNav(extractContent($));
	const slug = slugify(title, `douban-${topicId}`);

	const { body: localizedBody, imageCount } = await localizeImages(body, topicId, cookie);
	body = localizedBody;

	const frontmatter = [
		'---',
		`title: "${escapeYamlString(title)}"`,
		`date: ${date}`,
		`sourceUrl: "${resolvedUrl || sourceUrl}"`,
		'sourceLabel: "豆瓣"',
		'---',
		'',
	].join('\n');

	const outputPath = join(BLOG_DIR, `${slug}.md`);
	await mkdir(BLOG_DIR, { recursive: true });
	await writeFile(outputPath, frontmatter + body + '\n', 'utf8');

	existingTopicIds.set(topicId, outputPath);

	return {
		status: 'OK',
		topicId,
		url: resolvedUrl || sourceUrl,
		title,
		date,
		outputPath,
		imageCount,
	};
}

function printUsage() {
	console.error(`Usage:
  DOUBAN_COOKIE="..." node scripts/import-douban-topic.mjs <url> [url2 ...]
  DOUBAN_COOKIE="..." node scripts/import-douban-topic.mjs --file <path> [--force]

Options:
  --file   Read URLs from a text file (one per line, # for comments)
  --force  Overwrite existing imports with the same topic ID`);
}

async function main() {
	let options;
	try {
		options = parseArgs(process.argv);
	} catch (err) {
		console.error(err.message);
		printUsage();
		process.exit(1);
	}

	const { force, filePath, urls: cliUrls } = options;
	const urls = [...cliUrls];

	if (filePath) {
		const fileUrls = await readUrlsFromFile(filePath);
		urls.push(...fileUrls);
	}

	if (urls.length === 0) {
		printUsage();
		process.exit(1);
	}

	const cookie = process.env.DOUBAN_COOKIE ?? '';
	const existingTopicIds = await loadExistingTopicIds();

	const results = { ok: 0, skip: 0, fail: 0 };

	for (let i = 0; i < urls.length; i++) {
		const inputUrl = urls[i];
		if (i > 0) {
			await sleep(REQUEST_DELAY_MS);
		}

		try {
			const result = await importTopic(inputUrl, cookie, existingTopicIds, force);

			if (result.status === 'SKIP') {
				results.skip++;
				console.log(`SKIP  ${result.url} — ${result.reason}`);
			} else {
				results.ok++;
				console.log(`OK    ${result.url}`);
				console.log(`      → ${result.outputPath}`);
				console.log(`      title: ${result.title}, date: ${result.date}, images: ${result.imageCount}`);
			}
		} catch (err) {
			results.fail++;
			console.log(`FAIL  ${inputUrl}`);
			console.log(`      ${err.message || err}`);
		}
	}

	console.log('');
	console.log(`Done: ${results.ok} imported, ${results.skip} skipped, ${results.fail} failed`);

	if (results.fail > 0) {
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err.message || err);
	process.exit(1);
});
