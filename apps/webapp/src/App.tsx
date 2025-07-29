import { GlobalProgressProvider } from "@/components/react/GlobalProgressProvider";
import Layout from "@/components/react/Layout";
import { Navigation } from "@/components/react/Navigation";
import { SpacesDrawer } from "@/components/react/SpacesDrawer";
import { SpacesDrawerProvider, useSpacesDrawer } from "@/components/react/SpacesDrawerProvider";
import { THEME_STORAGE_KEY } from "@/stores/theme";
import { lazy, Suspense, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { DemoModeBanner } from "./components/react/DemoModeBanner";
import { useDemoMode } from "./components/react/hooks/useDemoMode";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import HomePage from "./pages/HomePage";

const ContentEntriesPage = lazy(() => import("@/pages/ContentEntriesPage"));
const SpacesPage = lazy(() => import("@/pages/SpacesPage"));
const AccessControlPage = lazy(() => import("@/pages/admin/AccessControlPage"));
const ContentTypeEditorPage = lazy(() => import("@/pages/editor/ContentTypeEditorPage"));
const ContentTypeSelectPage = lazy(() => import("@/pages/editor/ContentTypeSelectPage"));
const EntryEditorPage = lazy(() => import("@/pages/editor/EntryEditorPage"));

function AppContent() {
    const { openSpacesDrawer, isSpacesDrawerOpen, closeSpacesDrawer } = useSpacesDrawer();
    const { isDemoMode } = useDemoMode();

    return (
        <div>
            {isDemoMode && <DemoModeBanner />}
            <GlobalProgressProvider />
            <Navigation onSpacesClick={openSpacesDrawer} />
            <Layout>

                <Suspense fallback={<div className="flex items-center justify-center p-8">Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
                            path="/editor/space/:spaceId/content-type/:contentTypeId/new"
                            element={<EntryEditorPage />}
                        />
                        <Route
                            path="/editor/space/:spaceId/entry/:entryId"
                            element={<EntryEditorPage />}
                        />
                    </Routes>
                </Suspense>
            </Layout>
            <SpacesDrawer
                open={isSpacesDrawerOpen}
                onClose={closeSpacesDrawer}
            />
            <Toaster position="top-right" richColors closeButton duration={4000} />
        </div>
    );
}

function App() {
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
        <SpacesDrawerProvider>
            <AppContent />
        </SpacesDrawerProvider>
    );
}

export default App;
