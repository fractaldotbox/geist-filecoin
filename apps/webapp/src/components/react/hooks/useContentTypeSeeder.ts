import { SAMPLE_SPACES } from "@geist-filecoin/domain/fixture/space";
import { useStore } from "@livestore/react";
import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { BLOG, LANDING, PRODUCT } from "@/content-type/content-type";
import { allContentTypes$ } from "@/livestore/queries";

export function useContentTypeSeeder() {
	const { store } = useStore();
	const { createContentType } = useLiveStore();
	const existingContentTypes = store.useQuery(allContentTypes$);

	const seedContentTypes = () => {
		if (existingContentTypes.length > 0) {
			return;
		}

		[BLOG, LANDING, PRODUCT].map(({ id, description, schema }) => {
			console.log("seeding content type", id);
			createContentType({
				id,
				name: id,
				description,
				properties: schema.properties,
				required: schema.required,
				spaceId: SAMPLE_SPACES?.[0].id,
			});
		});
	};

	return { seedContentTypes };
}
