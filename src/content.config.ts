import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const games = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/games' }),
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		summary: z.string(),
		dateStart: z.string(),
		dateEnd: z.string().optional(),
		tags: z.array(z.string()).default([]),
		heroImage: z.string().optional(),
		featured: z.boolean().default(false),
		externalLinks: z
			.array(
				z.object({
					label: z.string(),
					url: z.string(),
				}),
			)
			.optional(),
		headerLayout: z.enum(['default', 'split-hero']).default('split-hero'),
		intro: z.array(z.string()).optional(),
		projectMeta: z
			.object({
				time: z.string().optional(),
				role: z.string().optional(),
				tools: z.string().optional(),
			})
			.optional(),
	}),
});

const experience = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/experience' }),
	schema: z.object({
		company: z.string(),
		role: z.string(),
		period: z.string(),
		order: z.number(),
		appStoreUrl: z.string().optional(),
	}),
});

const blog = defineCollection({
	loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
	schema: z.object({
		title: z.string(),
		date: z.coerce.date(),
		sourceUrl: z.string().url().optional(),
		sourceLabel: z.string().optional(),
	}),
});

export const collections = { games, experience, blog };
