// scripts/seed.ts   run: npx tsx --env-file=.env.local scripts/seed.ts
import { pool, withTx } from '../lib/db'

export const USERS = {
  owner:    '00000000-0000-0000-0000-000000000001',
  marketer: '00000000-0000-0000-0000-000000000002',
  viewer:   '00000000-0000-0000-0000-000000000003',
}

const BUSINESSES = [
  'Brew & Bean Cafe', 'Saffron Table', 'Masala Lane Kitchen', 'The Chai Studio', 'Glow Salon & Spa',
  'Velvet Touch Salon', 'Iron House Gym', 'FitNest Studio', 'Zen Flow Yoga', 'Silk Route Sarees',
  'Banarasi Threads', 'Kanjivaram Collective', 'Ethnic Edge Boutique', 'Urban Loom Clothing', 'Nook Home Decor',
  'Teak & Tide Furniture', 'Circuit City Electronics', 'Pixel Point Mobiles', 'Cloud Kitchen Co', 'Spice Box Delivery',
  'Little Learners Academy', 'Bright Path Tutorials', 'Prime Realty Advisors', 'Harbor Homes Estate', 'The Local Mart',
]
const AREAS = ['Bandra', 'Borivali']                       // 25 x 2 = 50 contacts
const SOURCES = ['instagram', 'walk-in', 'referral', 'website', 'google-maps']
const UNSUBSCRIBED = new Set([4, 11, 19])                 // indexes among the trial contacts

export async function seed() {
  await withTx(async db => {
    await db.query(`truncate audit_log, approvals, run_steps, agent_runs, engagement, outbox, campaigns,
                    registrations, webinars, pages, usage_events, invoices, subscriptions, plans,
                    contact_events, contacts, users restart identity cascade`)
    await db.query(
      `insert into users (id, name, email, role) values
       ($1,'Asha (Owner)','asha@nexora.example','owner'),
       ($2,'Rohan (Marketer)','rohan@nexora.example','marketer'),
       ($3,'Vikram (Viewer)','vikram@nexora.example','viewer')`,
      [USERS.owner, USERS.marketer, USERS.viewer])
    await db.query(
      `insert into plans (name, type, price_inr, unit_price_inr, included_units) values
       ('Brand Launch','flat',15000,0,0),
       ('Social Growth','flat',8000,0,0),
       ('AI Creative','usage',0,500,10)`)          // unit price is an assumption; label it as such

    let i = 0
    for (const area of AREAS) for (const biz of BUSINESSES) {
      const slug = `${biz}-${area}`.toLowerCase().replace(/[^a-z0-9]+/g, '.')
      const trial = i < 40
      await db.query(
        `insert into contacts (name, email, phone, tags, source, unsubscribed)
         values ($1,$2,$3,$4::text[],$5,$6) on conflict do nothing`,
        [`${biz} (${area})`, `${slug}@example.com`, `+91 90000 ${String(10000 + i).slice(-5)}`,
         trial ? ['trial'] : ['lead'], SOURCES[i % SOURCES.length], trial && UNSUBSCRIBED.has(i)])
      i++
    }
    // Duplicate-email attempts: the unique index on lower(email) silently drops these.
    await db.query(
      `insert into contacts (name, email) values ('Brew & Bean DUPLICATE','BREW.BEAN.CAFE.BANDRA@EXAMPLE.COM') on conflict do nothing`)

    await db.query(
      `insert into pages (slug, title, blocks, status) values ('nexora-digital','Nexora Digital', $1::jsonb, 'published')`,
      [JSON.stringify([
        { type: 'hero', headline: 'Design. Automate. Grow.', sub: 'AI-powered branding and growth for local businesses.' },
        { type: 'features', items: ['Brand identity', 'Social media growth', 'AI creative', 'Websites'] },
        { type: 'form', fields: ['name', 'email'], tag_on_submit: 'website-lead' },
      ])])
    await db.query(
      `insert into contact_events (contact_id, type, payload)
       select id, 'imported', jsonb_build_object('source', source) from contacts`)
  })
}

if (process.argv[1]?.endsWith('seed.ts')) {
  seed().then(() => console.log('seeded')).catch(e => {
    console.error(e)
    process.exitCode = 1
  }).finally(() => pool.end())
}
