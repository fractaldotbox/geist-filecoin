import { createResource } from "solid-js";

export const Demo = () => {
	const [name] = createResource(() =>
		fetch("https://swapi.info/api/people/1")
			.then((result) => result.json())
			.then((data) => data.name),
	);

	return (
		<>
			<div>Solidjs working: {name()}</div>
		</>
	);
};

export default Demo;
