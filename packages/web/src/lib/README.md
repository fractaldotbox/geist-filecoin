# Schema Loader

This module provides utilities for loading JSON schemas from the `src/schemas` directory.

## Features

- Type-safe schema loading with TypeScript
- Support for multiple schema templates (blog, landing, product)
- Error handling and loading states
- React hooks for easy integration

## Usage


### Using the React Hook

```typescript
import { useSchemaLoader } from '@/components/react/hooks/useSchemaLoader'

function MyComponent() {
  const { loading, error, loadSchema } = useSchemaLoader()

  const handleLoadBlog = async () => {
    const schema = await loadSchema('blog')
    if (schema) {
      // Use the schema
      console.log('Blog schema:', schema)
    }
  }

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      <button onClick={handleLoadBlog}>Load Blog Schema</button>
    </div>
  )
}
```

### Using the SchemaLoader Component

```typescript
import { SchemaLoader } from '@/components/react/SchemaLoader'

function MyPage() {
  const handleSchemaLoad = (schema, template) => {
    console.log(`Loaded ${template} schema:`, schema)
  }

  return (
    <div>
      <SchemaLoader onSchemaLoad={handleSchemaLoad} />
    </div>
  )
}
```

## Available Schemas

The following schema templates are available:

- `blog` - Blog post schema with title, content, author, etc.
- `landing` - Landing page schema
- `product` - Product schema

## Schema Structure

Each schema follows the JSON Schema format:

```json
{
  "type": "object",
  "properties": {
    "fieldName": {
      "type": "string",
      "description": "Field description"
    }
  },
  "required": ["fieldName"]
}
```

## Integration with LiveStore

The schema loader can be integrated with LiveStore for persistent storage:

```typescript
import { useLoadSchema } from '@/stores/schema'

function MyComponent() {
  const { loadSchema } = useLoadSchema()

  const handleLoadAndStore = async (template) => {
    // This will load the schema and store it in LiveStore
    await loadSchema(template)
  }

  return (
    <button onClick={() => handleLoadAndStore('blog')}>
      Load and Store Blog Schema
    </button>
  )
}
```

## Adding New Schemas

To add a new schema:

1. Create a new JSON file in `src/schemas/` (e.g., `newsletter.json`)
2. Update the `SCHEMA_TEMPLATES` array in `schema-loader.ts`
3. The new schema will be automatically available

## Error Handling

The schema loader includes comprehensive error handling:

- File not found errors
- Invalid JSON errors
- Type validation errors

All errors are logged to the console and can be handled in your components. 