import { GlobalProgressProvider } from "@/components/react/GlobalProgressProvider";
import Layout from "@/components/react/Layout";
import { Navigation } from "@/components/react/Navigation";
import { SpacesDrawer } from "@/components/react/SpacesDrawer";
import ContentTypesPage from "@/pages/ContentTypesPage";
import HomePage from "@/pages/HomePage";
import SpacesPage from "@/pages/SpacesPage";
import ContentTypeEditorPage from "@/pages/editor/ContentTypeEditorPage";
import ContentTypeSelectPage from "@/pages/editor/ContentTypeSelectPage";
import EntryEditorPage from "@/pages/editor/EntryEditorPage";
import { THEME_STORAGE_KEY } from "@/stores/theme";
import { useEffect, useState, createContext, useContext } from "react";
import { Route, Routes } from "react-router-dom";

// Create context for spaces drawer
const SpacesDrawerContext = createContext<{
	openSpacesDrawer: () => void;
} | null>(null);

export const useSpacesDrawer = () => {
	const context = useContext(SpacesDrawerContext);
	if (!context) {
		throw new Error('useSpacesDrawer must be used within SpacesDrawerProvider');
	}
	return context;
};

function App() {
	const [isSpacesDrawerOpen, setIsSpacesDrawerOpen] = useState(false);

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
				<GlobalProgressProvider />
				<Navigation onSpacesClick={openSpacesDrawer} />
				<Layout>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/spaces" element={<SpacesPage />} />
						<Route
							path="/editor/content-type/select"
							element={<ContentTypeSelectPage />}
						/>
						<Route
							path="/editor/content-type/:id"
							element={<ContentTypeEditorPage />}
						/>
						<Route path="/editor/entry/:id" element={<EntryEditorPage />} />
						<Route path="/content-types" element={<ContentTypesPage />} />
					</Routes>
				</Layout>
				<SpacesDrawer
					open={isSpacesDrawerOpen}
					onClose={() => setIsSpacesDrawerOpen(false)}
				/>
			</div>
		</SpacesDrawerContext.Provider>
	);
}

export default App;
