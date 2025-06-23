import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { useStore } from "@livestore/react";
import { allContentTypes$ } from "@/livestore/queries";
import { BLOG, LANDING, PRODUCT } from "@/schemas/schema";


export function useContentTypeSeeder() {
	const { store } = useStore();
	const { createContentType } = useLiveStore();
	const existingContentTypes = store.useQuery(allContentTypes$);

	const seedContentTypes = () => {
		console.log('seedContentTypes');
      if (existingContentTypes.length > 0) {
        console.log("Content types already exist. Skipping seed.");
        return;
      }

      [BLOG, LANDING, PRODUCT].map(({id,description,schema})=>{
		createContentType({
			id,
			name: id,
			description,
			properties: schema.properties,
			required: schema.required,
		  });
	  })
  
  }

	return { seedContentTypes };
} 