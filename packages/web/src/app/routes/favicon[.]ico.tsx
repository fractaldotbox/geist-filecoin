export async function loader() {
	return new Response(null, {
		status: 204,
		headers: {
			"Content-Type": "image/x-icon",
		},
	});
}
