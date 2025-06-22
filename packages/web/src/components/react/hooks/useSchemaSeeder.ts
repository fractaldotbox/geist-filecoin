import { useLiveStore } from "@/components/react/hooks/useLiveStore";
import { useStore } from "@livestore/react";
import { allSchemas$ } from "@/livestore/queries";
import { BLOG, LANDING, PRODUCT } from "@/schemas/schema";


export function useSchemaSeeder() {
	const { store } = useStore();
	const { createSchema } = useLiveStore();
	const existingSchemas = store.useQuery(allSchemas$);

	const seedSchemas = () => {
		console.log('seedSchemas');
      if (existingSchemas.length > 0) {
        console.log("Schemas already exist. Skipping seed.");
        return;
      }

      [BLOG, LANDING, PRODUCT].map(({id,description,schema})=>{
		createSchema({
			id,
			name: id,
			description,
			properties: schema.properties,
			required: schema.required,
		  });
	  })
  
  }

	return { seedSchemas };
} 