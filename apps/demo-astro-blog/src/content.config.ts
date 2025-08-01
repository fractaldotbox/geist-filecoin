import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const domain = process.env.CF_DOMAIN || "http://localhost:4003";

const getAuthHeaders = () => {
	const token = process.env.CF_JWT_TOKEN;
	const headers: HeadersInit = {};
	if (token) {
		headers.Authorization = `Bearer ${token}`;
	}
	return headers;
};

const blog = defineCollection({
	loader: {
		name: "blog-loader",
		load: async ({ store, parseData, renderMarkdown }) => {
			console.log(`${domain}`);
			console.log(getAuthHeaders());
			const response = await fetch(`${domain}/api/resources/blogs?mode=append`, {
				headers: getAuthHeaders(),
			});
			const responseData = await response.json();
			store.clear();

			// Handle new API response structure
			if (responseData.resources) {
				for (const resource of responseData.resources) {
					// Extract blogs from resource data (could be array or single item)
					const blogs = Array.isArray(resource.data)
						? resource.data
						: [resource.data];

					for (const blog of blogs) {
						const parsedData = await parseData({
							id: blog.id,
							data: blog,
						});

						store.set({
							id: blog.id,
							data: parsedData,
							rendered: await renderMarkdown(blog.content),
						});
					}
				}
			}
		},
	},
	schema: ({ image }) =>
		z.object({
			id: z.string(),
			slug: z.string(),
			title: z.string(),
			metaDescription: z.string(),
			author: z.string(),
			publishDate: z.coerce.date(),
			updatedDate: z.coerce.date().optional(),
			heroImage: image().optional(),
			content: z.string(),
			tags: z.array(z.string()).optional(),
		}),
});

const landing = defineCollection({
	loader: {
		name: "landing-loader",
		load: async ({ store, parseData }) => {
			const response = await fetch(
				`${domain}/api/resources/landing?decrypt=false&mode=replace`,
				{ headers: getAuthHeaders() },
			);
			const responseData = await response.json();
			store.clear();

			// Handle new API response structure
			if (responseData.resources && responseData.resources.length > 0) {
				// Take the first (latest) resource for landing page
				const landingData = responseData.resources[0].data;

				const parsedData = await parseData({
					id: "landing",
					data: landingData,
				});

				store.set({
					id: "landing",
					data: parsedData,
				});
			}
		},
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
		features: z.array(
			z.object({
				title: z.string(),
				description: z.string(),
				icon: z.string(),
			}),
		),
		metaDescription: z.string(),
	}),
});

const products = defineCollection({
	loader: {
		name: "products-loader",
		load: async ({ store, parseData }) => {
			const response = await fetch(
				`${domain}/api/resources/products?mode=append`,
				{ headers: getAuthHeaders() },
			);
			const responseData = await response.json();
			store.clear();

			// Handle new API response structure
			if (responseData.resources) {
				for (const resource of responseData.resources) {
					// Extract products from resource data (could be array or single item)
					const products = Array.isArray(resource.data)
						? resource.data
						: [resource.data];

					for (const product of products) {
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
			}
		},
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
	}),
});

export const collections = { blog, landing, products };
