import { useStore } from '@livestore/react'
import { events } from '../../../livestore/schema.js'
import type { EntryFormData, FileFieldValue } from '../fields/types'

export const useLiveStore = () => {
  const { store } = useStore()

  const createEntry = (entryData: EntryFormData & { schemaId: string }) => {
    const id = crypto.randomUUID()
    const now = new Date()
    
    // Handle media field properly
    const media = entryData.media as FileFieldValue | undefined
    
    return store.commit(
      events.entryCreated({
        id,
        schemaId: entryData.schemaId,
        title: entryData.title || '',
        content: entryData.content || '',
        mediaType: media?.mediaType,
        mediaUrl: media?.url,
        mediaCid: media?.cid,
        tags: entryData.tags ? JSON.stringify(entryData.tags) : undefined,
        publishedAt: entryData.publishedAt,
      })
    )
  }

  const updateEntry = (id: string, entryData: Partial<EntryFormData>) => {
    // Handle media field properly
    const media = entryData.media as FileFieldValue | undefined
    
    return store.commit(
      events.entryUpdated({
        id,
        title: entryData.title,
        content: entryData.content,
        mediaType: media?.mediaType,
        mediaUrl: media?.url,
        mediaCid: media?.cid,
        tags: entryData.tags ? JSON.stringify(entryData.tags) : undefined,
        publishedAt: entryData.publishedAt,
      })
    )
  }

  const deleteEntry = (id: string) => {
    return store.commit(
      events.entryDeleted({
        id,
        deletedAt: new Date(),
      })
    )
  }

  const createSchema = (schemaData: {
    id: string
    name: string
    description: string
    properties: Record<string, any>
    required: string[]
  }) => {
    return store.commit(
      events.schemaCreated({
        id: schemaData.id,
        name: schemaData.name,
        description: schemaData.description,
        properties: JSON.stringify(schemaData.properties),
        required: JSON.stringify(schemaData.required),
      })
    )
  }

  const updateSchema = (id: string, schemaData: Partial<{
    name: string
    description: string
    properties: Record<string, any>
    required: string[]
  }>) => {
    return store.commit(
      events.schemaUpdated({
        id,
        name: schemaData.name,
        description: schemaData.description,
        properties: schemaData.properties ? JSON.stringify(schemaData.properties) : undefined,
        required: schemaData.required ? JSON.stringify(schemaData.required) : undefined,
      })
    )
  }

  const deleteSchema = (id: string) => {
    return store.commit(
      events.schemaDeleted({
        id,
        deletedAt: new Date(),
      })
    )
  }

  const setUiState = (uiState: {
    currentSchemaId?: string
    formData?: string
    isSubmitting?: boolean
    uploadProgress?: number
  }) => {
    return store.commit(events.uiStateSet(uiState))
  }

  return {
    store,
    createEntry,
    updateEntry,
    deleteEntry,
    createSchema,
    updateSchema,
    deleteSchema,
    setUiState,
  }
} 