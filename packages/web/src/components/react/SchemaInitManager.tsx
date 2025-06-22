import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Badge } from './ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { initializeSchemas, initializeSchema, type SchemaFile } from '../../lib/initialize-schemas'
import { useLiveStore } from './hooks/useLiveStore'

interface SchemaStatus {
    id: string
    name: string
    status: 'pending' | 'loading' | 'success' | 'error'
    error?: string
    schema?: SchemaFile
}

interface SchemaInitManagerProps {
    className?: string
}

export function SchemaInitManager({ className }: SchemaInitManagerProps) {
    const [schemas, setSchemas] = useState<SchemaStatus[]>([])
    const [isInitializingAll, setIsInitializingAll] = useState(false)
    const [overallStatus, setOverallStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [selectedSchemas, setSelectedSchemas] = useState<string[]>([])
    const [showPreview, setShowPreview] = useState<string | null>(null)

    const { createSchema } = useLiveStore()

    // Available schema files
    const schemaFiles = ['blog', 'landing', 'product']

    // Initialize schemas list
    useEffect(() => {
        const initialSchemas: SchemaStatus[] = schemaFiles.map(id => ({
            id,
            name: id.charAt(0).toUpperCase() + id.slice(1),
            status: 'pending'
        }))
        setSchemas(initialSchemas)
    }, [])

    // Handle individual schema initialization
    const handleInitializeSchema = async (schemaId: string) => {
        setSchemas(prev => prev.map(schema =>
            schema.id === schemaId
                ? { ...schema, status: 'loading', error: undefined }
                : schema
        ))

        try {
            const schemaFile = await initializeSchema(schemaId, createSchema)
            setSchemas(prev => prev.map(schema =>
                schema.id === schemaId
                    ? { ...schema, status: 'success', schema: schemaFile }
                    : schema
            ))
        } catch (error) {
            setSchemas(prev => prev.map(schema =>
                schema.id === schemaId
                    ? { ...schema, status: 'error', error: error instanceof Error ? error.message : 'Unknown error' }
                    : schema
            ))
        }
    }

    // Handle bulk initialization
    const handleInitializeAll = async () => {
        setIsInitializingAll(true)
        setOverallStatus('loading')

        // Reset all schemas to pending
        setSchemas(prev => prev.map(schema => ({ ...schema, status: 'pending', error: undefined })))

        try {
            const result = await initializeSchemas(createSchema)

            // Update all schemas to success
            setSchemas(prev => prev.map(schema => ({ ...schema, status: 'success' })))
            setOverallStatus('success')
        } catch (error) {
            setOverallStatus('error')
            // Mark all as error
            setSchemas(prev => prev.map(schema => ({
                ...schema,
                status: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
            })))
        } finally {
            setIsInitializingAll(false)
        }
    }

    // Handle selected schemas initialization
    const handleInitializeSelected = async () => {
        if (selectedSchemas.length === 0) return

        setOverallStatus('loading')

        // Reset selected schemas to pending
        setSchemas(prev => prev.map(schema =>
            selectedSchemas.includes(schema.id)
                ? { ...schema, status: 'pending', error: undefined }
                : schema
        ))

        const results = await Promise.allSettled(
            selectedSchemas.map(schemaId => initializeSchema(schemaId, createSchema))
        )

        // Update schemas based on results
        setSchemas(prev => prev.map(schema => {
            if (!selectedSchemas.includes(schema.id)) return schema

            const resultIndex = selectedSchemas.indexOf(schema.id)
            const result = results[resultIndex]

            if (result.status === 'fulfilled') {
                return { ...schema, status: 'success', schema: result.value }
            }

            return {
                ...schema,
                status: 'error',
                error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
            }
        }))

        const successful = results.filter(r => r.status === 'fulfilled').length
        const failed = results.filter(r => r.status === 'rejected').length

        setOverallStatus(failed === 0 ? 'success' : 'error')
    }

    // Toggle schema selection
    const toggleSchemaSelection = (schemaId: string) => {
        setSelectedSchemas(prev =>
            prev.includes(schemaId)
                ? prev.filter(id => id !== schemaId)
                : [...prev, schemaId]
        )
    }

    // Get status counts
    const statusCounts = {
        pending: schemas.filter(s => s.status === 'pending').length,
        loading: schemas.filter(s => s.status === 'loading').length,
        success: schemas.filter(s => s.status === 'success').length,
        error: schemas.filter(s => s.status === 'error').length,
    }

    const getStatusBadge = (status: SchemaStatus['status']) => {
        const variants = {
            pending: 'secondary',
            loading: 'default',
            success: 'default',
            error: 'destructive'
        } as const

        return (
            <Badge variant={variants[status]} className="capitalize">
                {status === 'loading' ? 'Initializing...' : status}
            </Badge>
        )
    }

    return (
        <div className={className}>
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="individual">Individual</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk Operations</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Schema Status Overview</CardTitle>
                            <CardDescription>
                                Current status of all available schemas
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="text-center p-4 bg-gray-50 rounded-lg">
                                    <div className="text-2xl font-bold text-gray-600">{statusCounts.pending}</div>
                                    <div className="text-sm text-gray-500">Pending</div>
                                </div>
                                <div className="text-center p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-600">{statusCounts.loading}</div>
                                    <div className="text-sm text-blue-500">Loading</div>
                                </div>
                                <div className="text-center p-4 bg-green-50 rounded-lg">
                                    <div className="text-2xl font-bold text-green-600">{statusCounts.success}</div>
                                    <div className="text-sm text-green-500">Success</div>
                                </div>
                                <div className="text-center p-4 bg-red-50 rounded-lg">
                                    <div className="text-2xl font-bold text-red-600">{statusCounts.error}</div>
                                    <div className="text-sm text-red-500">Error</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                {schemas.map((schema) => (
                                    <div key={schema.id} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <div className="font-medium capitalize">{schema.name}</div>
                                            {getStatusBadge(schema.status)}
                                        </div>
                                        <div className="flex space-x-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setShowPreview(showPreview === schema.id ? null : schema.id)}
                                            >
                                                {showPreview === schema.id ? 'Hide' : 'Preview'}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleInitializeSchema(schema.id)}
                                                disabled={schema.status === 'loading'}
                                            >
                                                Initialize
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Individual Tab */}
                <TabsContent value="individual" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Individual Schema Initialization</CardTitle>
                            <CardDescription>
                                Initialize schemas one by one with detailed feedback
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {schemas.map((schema) => (
                                <div key={schema.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center space-x-3">
                                            <h3 className="font-medium capitalize">{schema.name}</h3>
                                            {getStatusBadge(schema.status)}
                                        </div>
                                        <Button
                                            onClick={() => handleInitializeSchema(schema.id)}
                                            disabled={schema.status === 'loading'}
                                            size="sm"
                                        >
                                            {schema.status === 'loading' ? 'Initializing...' : 'Initialize'}
                                        </Button>
                                    </div>

                                    {schema.error && (
                                        <Alert className="border-red-200 bg-red-50">
                                            <AlertDescription className="text-red-800">
                                                {schema.error}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {schema.status === 'success' && (
                                        <Alert className="border-green-200 bg-green-50">
                                            <AlertDescription className="text-green-800">
                                                Schema "{schema.name}" initialized successfully!
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Bulk Operations Tab */}
                <TabsContent value="bulk" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulk Schema Operations</CardTitle>
                            <CardDescription>
                                Initialize multiple schemas at once or select specific ones
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Initialize All */}
                            <div className="space-y-3">
                                <h3 className="font-medium">Initialize All Schemas</h3>
                                <p className="text-sm text-muted-foreground">
                                    Initialize all available schemas in parallel
                                </p>
                                <Button
                                    onClick={handleInitializeAll}
                                    disabled={isInitializingAll}
                                    className="w-full"
                                >
                                    {isInitializingAll ? 'Initializing All Schemas...' : 'Initialize All Schemas'}
                                </Button>
                            </div>

                            {/* Select Specific Schemas */}
                            <div className="space-y-3">
                                <h3 className="font-medium">Select Specific Schemas</h3>
                                <p className="text-sm text-muted-foreground">
                                    Choose which schemas to initialize
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    {schemas.map((schema) => (
                                        <Button
                                            key={schema.id}
                                            variant={selectedSchemas.includes(schema.id) ? "default" : "outline"}
                                            onClick={() => toggleSchemaSelection(schema.id)}
                                            className="justify-start"
                                        >
                                            <div className="w-4 h-4 border-2 border-current rounded mr-2 flex items-center justify-center">
                                                {selectedSchemas.includes(schema.id) && (
                                                    <div className="w-2 h-2 bg-current rounded-sm" />
                                                )}
                                            </div>
                                            {schema.name}
                                        </Button>
                                    ))}
                                </div>
                                <Button
                                    onClick={handleInitializeSelected}
                                    disabled={selectedSchemas.length === 0 || overallStatus === 'loading'}
                                    className="w-full"
                                >
                                    {overallStatus === 'loading' ? 'Initializing Selected...' : `Initialize Selected (${selectedSchemas.length})`}
                                </Button>
                            </div>

                            {/* Overall Status */}
                            {overallStatus !== 'idle' && (
                                <Alert className={
                                    overallStatus === 'success' ? 'border-green-200 bg-green-50' :
                                        overallStatus === 'error' ? 'border-red-200 bg-red-50' :
                                            'border-blue-200 bg-blue-50'
                                }>
                                    <AlertDescription className={
                                        overallStatus === 'success' ? 'text-green-800' :
                                            overallStatus === 'error' ? 'text-red-800' :
                                                'text-blue-800'
                                    }>
                                        {overallStatus === 'loading' && 'Initializing schemas...'}
                                        {overallStatus === 'success' && 'All selected schemas initialized successfully!'}
                                        {overallStatus === 'error' && 'Some schemas failed to initialize. Check individual status for details.'}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Schema Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-medium capitalize">{showPreview} Schema Preview</h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPreview(null)}
                                >
                                    Close
                                </Button>
                            </div>
                            <SchemaPreview schemaId={showPreview} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

// Schema Preview Component
function SchemaPreview({ schemaId }: { schemaId: string }) {
    const [schema, setSchema] = useState<SchemaFile | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const loadSchema = async () => {
            try {
                setLoading(true)
                const schemaData = await apiClient.get(`/schemas/${schemaId}.json`) as any

                const transformedSchema: SchemaFile = {
                    id: schemaId,
                    name: schemaId.charAt(0).toUpperCase() + schemaId.slice(1),
                    description: `Schema for ${schemaId} content type`,
                    properties: schemaData.properties || {},
                    required: schemaData.required || [],
                }
                setSchema(transformedSchema)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load schema')
            } finally {
                setLoading(false)
            }
        }

        loadSchema()
    }, [schemaId])

    if (loading) {
        return <div className="text-center py-8">Loading schema preview...</div>
    }

    if (error) {
        return (
            <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
        )
    }

    if (!schema) {
        return <div className="text-center py-8">Schema not found</div>
    }

    return (
        <div className="space-y-4">
            <div>
                <h4 className="font-medium mb-2">Properties</h4>
                <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                    <pre className="text-sm">{JSON.stringify(schema.properties, null, 2)}</pre>
                </div>
            </div>

            {schema.required.length > 0 && (
                <div>
                    <h4 className="font-medium mb-2">Required Fields</h4>
                    <div className="flex flex-wrap gap-2">
                        {schema.required.map((field) => (
                            <Badge key={field} variant="secondary">{field}</Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
} 