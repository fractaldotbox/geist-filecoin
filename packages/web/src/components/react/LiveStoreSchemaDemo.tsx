import { useStore } from '@livestore/react'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { Badge } from './ui/badge'
import { allSchemas$ } from '../../livestore/queries'
import { useSchemaSeeder } from './hooks/useSchemaSeeder'
import { useLiveStore } from './hooks/useLiveStore'
import { Download, Trash2, Plus, Database } from 'lucide-react'

export function LiveStoreSchemaDemo() {
    const { store } = useStore()
    const { seedSchemas } = useSchemaSeeder()
    const { deleteSchema, createSchema } = useLiveStore()

    // Query schemas from LiveStore
    const schemas = store.useQuery(allSchemas$)

    const handleSeedSchemas = () => {
        seedSchemas()
    }

    const handleDeleteSchema = (schemaId: string) => {
        deleteSchema(schemaId)
    }

    const handleCreateTestSchema = () => {
        createSchema({
            id: `test-${Date.now()}`,
            name: 'Test Schema',
            description: 'A test schema created via LiveStore',
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
                    <h2 className="text-lg font-semibold">LiveStore Schema Demo</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">{schemas.length}</div>
                        <div className="text-sm text-muted-foreground">Total Schemas</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                            {schemas.filter(s => s.deletedAt === null).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Active Schemas</div>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg">
                        <div className="text-2xl font-bold">
                            {schemas.filter(s => s.deletedAt !== null).length}
                        </div>
                        <div className="text-sm text-muted-foreground">Deleted Schemas</div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button
                        onClick={handleSeedSchemas}
                        disabled={isSeeding}
                        className="flex items-center gap-2"
                    >
                        <Download className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={handleCreateTestSchema}
                        variant="outline"
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Create Test Schema
                    </Button>
                </div>
            </Card>

            {/* Schema List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold">Schemas in LiveStore</h3>

                {schemas.length === 0 ? (
                    <Card className="p-8 text-center">
                        <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No schemas in LiveStore yet</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Use the buttons above to seed schemas or create a test schema
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {schemas.map((schema) => (
                            <Card key={schema.id} className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className="font-semibold">
                                            {schema.name || schema.id}
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            {schema.description}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {schema.deletedAt && (
                                            <Badge variant="destructive">Deleted</Badge>
                                        )}
                                        <Badge variant="outline">{schema.id}</Badge>
                                    </div>
                                </div>

                                <div className="text-xs text-muted-foreground mb-3">
                                    <div>Properties: {Object.keys(schema.properties ? JSON.parse(schema.properties) : {}).length}</div>
                                    <div>Required: {schema.required ? JSON.parse(schema.required).length : 0} fields</div>
                                    <div>Created: {new Date(schema.createdAt).toLocaleDateString()}</div>
                                </div>

                                {!schema.deletedAt && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleDeleteSchema(schema.id)}
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