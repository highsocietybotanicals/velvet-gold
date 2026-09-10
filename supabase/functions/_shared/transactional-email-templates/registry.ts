import type { TemplateEntry } from './types.ts'
import { template as commercialAccess } from './commercial-access.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'commercial-access': commercialAccess,
}