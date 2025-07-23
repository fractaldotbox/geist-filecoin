import { type LoaderFunctionArgs, redirect } from "react-router";
import App from "../../App";
import { blueskyOAuth } from "../../lib/bluesky-oauth";

export default function AuthCallback() {
	return <App />;
}
