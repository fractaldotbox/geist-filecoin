import { useStore } from '@livestore/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { allContentTypes$ } from '../../livestore/queries'
import { useContentTypeSeeder } from './hooks/useContentTypeSeeder'
import { useLiveStore } from './hooks/useLiveStore'
import { Download, Trash2, Plus, Database } from 'lucide-react'

export function LiveStoreContentTypeDemo() {
    const { store } = useStore()
    const { seedContentTypes } = useContentTypeSeeder()
    const { deleteContentType, createContentType } = useLiveStore()

    // Query content types from LiveStore
    const contentTypes = store.useQuery(allContentTypes$)

    const handleSeedContentTypes = () => {
        seedContentTypes()
    }

    const handleDeleteContentType = (contentTypeId: string) => {
        deleteContentType(contentTypeId)
    }

    const handleCreateTestContentType = () => {
        createContentType({
            id: `test-${Date.now()}`,
            name: 'Test Content Type',
            description: 'A test content type created via LiveStore',
            properties: {
                title: { type: 'string', description: 'Test title' },
                content: { type: 'string', description: 'Test content' }
            },
            required: ['title']
        })
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Database className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">LiveStore Content Type Demo</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{contentTypes.length}</div>
                        <div className="text-sm text-muted-foreground">Total Content Types</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                            {contentTypes.filter(s => s.deletedAt === null).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Content Types</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                            {contentTypes.filter(s => s.deletedAt !== null).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Deleted Content Types</div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleSeedContentTypes}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleCreateTestContentType}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Test Content Type
                    </Button>
                </div>
            </Card>

            {/* Content Type List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Content Types in LiveStore</h3>

                {contentTypes.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No content types in LiveStore yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Use the buttons above to seed content types or create a test content type
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {contentTypes.map((contentType) => (
                            <Card key={contentType.id} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold">
                                            {contentType.name || contentType.id}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {contentType.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {contentType.deletedAt && (
                                            <Badge variant="destructive">Deleted</Badge>
                                        )}
                                        <Badge variant="outline">{contentType.id}</Badge>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground mb-3">
                                    <div>Properties: {Object.keys(contentType.properties ? JSON.parse(contentType.properties) : {}).length}</div>
                                    <div>Required: {contentType.required ? JSON.parse(contentType.required).length : 0} fields</div>
                                    <div>Created: {new Date(contentType.createdAt).toLocaleDateString()}</div>
                                </div>

                                {!contentType.deletedAt && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteContentType(contentType.id)}
                                        className="flex items-center gap-2"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        Delete
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
} 