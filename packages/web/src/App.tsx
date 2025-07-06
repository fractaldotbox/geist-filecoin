import { GlobalProgressProvider } from "@/components/react/GlobalProgressProvider";
import Layout from "@/components/react/Layout";
import { Navigation } from "@/components/react/Navigation";
import { SpacesDrawer } from "@/components/react/SpacesDrawer";
import ContentEntriesPage from "@/pages/ContentEntriesPage";
import SpacesPage from "@/pages/SpacesPage";
import AccessControlPage from "@/pages/admin/AccessControlPanel";
import ContentTypeEditorPage from "@/pages/editor/ContentTypeEditorPage";
import ContentTypeSelectPage from "@/pages/editor/ContentTypeSelectPage";
import EntryEditorPage from "@/pages/editor/EntryEditorPage";
import { THEME_STORAGE_KEY } from "@/stores/theme";
import { createContext, useContext, useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { DemoModeBanner } from "./components/react/DemoModeBanner";
import { useDemoMode } from "./components/react/hooks/useDemoMode";
import HomePage from "./pages/HomePage";

// Create context for spaces drawer
const SpacesDrawerContext = createContext<{
	openSpacesDrawer: () => void;
} | null>(null);

export const useSpacesDrawer = () => {
	const context = useContext(SpacesDrawerContext);
	if (!context) {
		throw new Error("useSpacesDrawer must be used within SpacesDrawerProvider");
	}
	return context;
};

function App() {
	const [isSpacesDrawerOpen, setIsSpacesDrawerOpen] = useState(false);

	const { isDemoMode } = useDemoMode();
	const openSpacesDrawer = () => setIsSpacesDrawerOpen(true);
	useEffect(() => {
		const applyTheme = () => {
			const theme = localStorage.getItem(THEME_STORAGE_KEY);
			if (theme === "dark") {
				document.documentElement.classList.add("dark");
			} else {
				document.documentElement.classList.remove("dark");
			}
		};

		applyTheme();
	}, []);

	return (
		<SpacesDrawerContext.Provider value={{ openSpacesDrawer }}>
			<div>
				{isDemoMode && <DemoModeBanner />}
				<GlobalProgressProvider />
				<Navigation onSpacesClick={openSpacesDrawer} />
				<Layout>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route
							path="/space/:spaceId/entries"
							element={<ContentEntriesPage />}
						/>
						<Route path="/space/:spaceId/iam" element={<AccessControlPage />} />
						<Route path="/spaces" element={<SpacesPage />} />
						<Route
							path="/editor/space/:spaceId/content-type/select"
							element={<ContentTypeSelectPage />}
						/>
						<Route
							path="/editor/space/:spaceId/content-type/:id"
							element={<ContentTypeEditorPage />}
						/>
						<Route
							path="/editor/space/:spaceId/content-type/:content-type-id/new"
							element={<EntryEditorPage />}
						/>
						<Route
							path="/editor/space/:spaceId/entry/:id"
							element={<EntryEditorPage />}
						/>
					</Routes>
				</Layout>
				<SpacesDrawer
					open={isSpacesDrawerOpen}
					onClose={() => setIsSpacesDrawerOpen(false)}
				/>
				<Toaster position="top-right" richColors closeButton duration={4000} />
			</div>
		</SpacesDrawerContext.Provider>
	);
}

export default App;
