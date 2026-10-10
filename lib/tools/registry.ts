// lib/tools/registry.ts
import type { Tool } from '../agent/types'
import { queryContacts } from './query_contacts'
import { tagContacts } from './tag_contacts'
import { createWebinar } from './create_webinar'
import { draftCampaign, scheduleCampaign } from './campaigns'
import { createPage, publishPage } from './pages'
import { offerSubscription } from './offer_subscription'
import { draftFollowup } from './draft_followup'

export const registry: Record<string, Tool> = Object.fromEntries(
  [queryContacts, tagContacts, createWebinar, draftCampaign, scheduleCampaign,
   createPage, publishPage, offerSubscription, draftFollowup].map(t => [t.name, t]))
