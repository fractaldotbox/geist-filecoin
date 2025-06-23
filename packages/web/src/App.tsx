import { Routes, Route } from 'react-router-dom'
import { GlobalProgressProvider } from '@/components/react/GlobalProgressProvider'
import { THEME_STORAGE_KEY } from '@/stores/theme'
import { useEffect } from 'react'
import Layout from '@/components/react/Layout'
import HomePage from '@/pages/HomePage'
import ContentTypeSelectPage from '@/pages/editor/ContentTypeSelectPage'
import ContentTypeEditorPage from '@/pages/editor/ContentTypeEditorPage'
import EntryEditorPage from '@/pages/editor/EntryEditorPage'
import ContentTypesPage from '@/pages/ContentTypesPage'

function App() {
    useEffect(() => {
        const applyTheme = () => {
            const theme = localStorage.getItem(THEME_STORAGE_KEY)
            if (theme === "dark") {
                document.documentElement.classList.add("dark")
            } else {
                document.documentElement.classList.remove("dark")
            }
        }

        applyTheme()
    }, [])

    return (
        <div>
            <GlobalProgressProvider />
            <Layout>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/editor/content-type/select" element={<ContentTypeSelectPage />} />
                    <Route path="/editor/content-type/:id" element={<ContentTypeEditorPage />} />
                    <Route path="/editor/entry/:id" element={<EntryEditorPage />} />
                    <Route path="/content-types" element={<ContentTypesPage />} />
                </Routes>
            </Layout>
        </div>
    )
}

export default App 