import { glob } from 'astro/loaders';
import { defineCollection, z } from 'astro:content';

const domain = process.env.CF_DOMAIN || 'http://localhost:4003';

const blog = defineCollection({
	loader: {
		name: 'blog-loader',
		load: async ({ store, parseData, renderMarkdown }) => {
			const response = await fetch(`${domain}/blogs`);
			const data = await response.json();
			store.clear();

			for (const blog of data) {
				const parsedData = await parseData({
					id: blog.id,
					data: blog,
				});

				store.set({
					id: blog.id,
					data: parsedData,
					rendered: await renderMarkdown(blog.content)
				})
			}
		}
	},
	schema: ({ image }) => z.object({
		id: z.string(),
		slug: z.string(),
		title: z.string(),
		description: z.string(),
		author: z.string(),
		publishDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: image().optional(),
		content: z.string(),
		tags: z.array(z.string()).optional(),
	})
});

const landing = defineCollection({
	loader: {
		name: 'landing-loader',
		load: async ({ store, parseData }) => {
			const response = await fetch(`${domain}/landing`);
			const data = await response.json();
			store.clear();

			const parsedData = await parseData({
				id: 'landing',
				data: data,
			});

			store.set({
				id: 'landing',
				data: parsedData,
			});
		}
	},
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		hero: z.object({
			headline: z.string(),
			subheadline: z.string(),
			ctaText: z.string(),
			ctaLink: z.string(),
			backgroundImage: z.string(),
		}),
		features: z.array(z.object({
			title: z.string(),
			description: z.string(),
			icon: z.string(),
		})),
		metaDescription: z.string(),
	})
});

const products = defineCollection({
	loader: {
		name: 'products-loader',
		load: async ({ store, parseData }) => {
			const response = await fetch(`${domain}/products`);
			const data = await response.json();
			store.clear();

			for (const product of data) {
				const parsedData = await parseData({
					id: product.slug,
					data: product,
				});

				store.set({
					id: product.slug,
					data: parsedData,
				});
			}
		}
	},
	schema: z.object({
		title: z.string(),
		slug: z.string(),
		description: z.string(),
		metaDescription: z.string(),
		price: z.number(),
		currency: z.string(),
		features: z.array(z.string()),
		specifications: z.object({
			storage_capacity: z.string(),
			bandwidth: z.string(),
			api_rate_limit: z.string(),
			encryption: z.string(),
			redundancy: z.string(),
			supported_formats: z.string(),
			integration: z.string(),
			compliance: z.string(),
			backup_retention: z.string(),
			geographic_distribution: z.string(),
		}),
		images: z.array(z.string()),
	})
});

export const collections = { blog, landing, products };
