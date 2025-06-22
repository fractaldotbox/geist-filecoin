import { Button } from "@/components/react/ui/button"
import { FilePlus } from "lucide-react"
import { Link } from "react-router-dom"

export default function HomePage() {
    return (
        <div id="container">
            <main className="p-10 m-auto">
                <section id="hero">
                    <h1 className="text-4xl font-bold pb-2">Geist</h1>
                    <h2>Content Management for decentralized team</h2>
                </section>

                <section className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 cursor-auto">
                    <div className="p-6 border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex flex-col items-center text-center">
                            <div className="mb-4 text-4xl">
                                <FilePlus className="w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-semibold mb-2">Create Entry</h3>
                            <p className="text-gray-600 mb-4">Add new content to your existing types</p>
                            <Link to="/editor/content-type/select">
                                <Button>Create Entry</Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    )
} 