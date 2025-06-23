import { createResource } from "solid-js";

export const Demo = () => {
	const [name] = createResource(() =>
		apiClient
			.get("https://swapi.info/api/people/1")
			.then((data: any) => data.name),
	);

	return (
		<>
			<div>Solidjs working: {name()}</div>
		</>
	);
};

export default Demo;
