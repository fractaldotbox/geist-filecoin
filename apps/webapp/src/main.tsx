import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import { AppWithLiveStore } from "./Root.tsx";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<BrowserRouter>
			<AppWithLiveStore />
		</BrowserRouter>
	</StrictMode>,
);
