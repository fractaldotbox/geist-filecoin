const BLOG = {
	id: "blog",
	description: "blog post with title, content, and meta description.",
	schema: {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		properties: {
			title: {
				type: "string",
				description: "The title of the blog post",
			},
			slug: {
				type: "string",
				description: "The URL-friendly version of the title",
			},
			heroImage: {
				type: "object",
				properties: {
					mediaType: {
						type: "string",
						description:
							"The MIME type of the uploaded image (e.g., image/jpeg, image/png)",
					},
					url: {
						type: "string",
						description: "The URL or path to the uploaded hero image",
					},
				},
				required: ["mediaType", "url"],
				description: "The hero image for the blog post, supporting file upload",
			},
			content: {
				type: "string",
				description: "The main content of the blog post. (markdown supported)",
			},
			metaDescription: {
				type: "string",
				description: "A brief description for SEO purposes",
			},
			author: {
				type: "string",
				description: "The name of the author",
			},
			publishDate: {
				type: "string",
				format: "date",
				description: "The date when the post was published",
			},
			tags: {
				type: "array",
				items: {
					type: "string",
				},
				description: "Tags associated with the blog post",
			},
		},
		required: [],
	},
};

const LANDING = {
	id: "landing",
	description: "landing page with hero section, features, and call-to-action",
	schema: {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		properties: {
			title: {
				type: "string",
				description: "The main headline of the landing page",
			},
			slug: {
				type: "string",
				description: "The URL-friendly version of the title",
			},
			hero: {
				type: "object",
				properties: {
					headline: {
						type: "string",
						description: "The main headline in the hero section",
					},
					subheadline: {
						type: "string",
						description: "A supporting headline",
					},
					ctaText: {
						type: "string",
						description: "The call-to-action button text",
					},
					ctaLink: {
						type: "string",
						description: "The URL for the call-to-action button",
					},
					backgroundImage: {
						type: "string",
						description: "URL of the hero background image",
					},
				},
				required: ["headline", "ctaText", "ctaLink"],
			},
			features: {
				type: "array",
				items: {
					type: "object",
					properties: {
						title: {
							type: "string",
							description: "The feature title",
						},
						description: {
							type: "string",
							description: "The feature description",
						},
						icon: {
							type: "string",
							description: "URL of the feature icon",
						},
					},
					required: ["title", "description"],
				},
			},
			metaDescription: {
				type: "string",
				description: "A brief description for SEO purposes",
			},
		},
		required: ["title", "slug", "hero", "features", "metaDescription"],
	},
};

const PRODUCT = {
	id: "product",
	description:
		"product page with title, description, price, currency, features, specifications, and images",
	schema: {
		$schema: "http://json-schema.org/draft-07/schema#",
		type: "object",
		properties: {
			title: {
				type: "string",
				description: "The name of the product",
			},
			slug: {
				type: "string",
				description: "The URL-friendly version of the product name",
			},
			description: {
				type: "string",
				description: "A detailed description of the product",
			},
			metaDescription: {
				type: "string",
				description: "A brief description for SEO purposes",
			},
			price: {
				type: "number",
				description: "The price of the product",
			},
			currency: {
				type: "string",
				description: "The currency code (e.g., USD, EUR)",
			},
			features: {
				type: "array",
				items: {
					type: "string",
				},
				description: "List of product features",
			},
			specifications: {
				type: "object",
				description: "Technical specifications of the product",
				additionalProperties: {
					type: "string",
				},
			},
			images: {
				type: "array",
				items: {
					type: "string",
				},
				description: "URLs of product images",
			},
		},
		required: [
			"title",
			"slug",
			"description",
			"metaDescription",
			"price",
			"currency",
		],
	},
};

export { BLOG, LANDING, PRODUCT };
