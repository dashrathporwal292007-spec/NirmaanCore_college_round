import { z } from 'zod'
import { pool, withTx } from '../db'
import { analytics } from '../services/analytics'
import { actor, endpoint, HttpError, idOf, slugOf, paging, uuid, requireRun, type IdContext, type SlugContext } from './http'

export const runs = endpoint(async (req: Request) => {
  await actor(req); const { limit, offset } = paging(req)
  const rows = (await pool.query(`select id,user_id,instruction,status,risk,required_role,created_at,completed_at,error
    from agent_runs order by created_at desc,id desc limit $1 offset $2`, [limit,offset])).rows
  return { runs: rows, limit, offset }
})
export const runDetail = endpoint(async (req: Request, ctx: IdContext) => {
  await actor(req); const id=await idOf(ctx); await requireRun(id)
  return withTx(async db => {
    await db.query('set transaction isolation level repeatable read, read only')
    const run=(await db.query('select * from agent_runs where id=$1',[id])).rows[0]
    const steps=(await db.query('select id,seq,tool,args,result,compensation,status from run_steps where run_id=$1 order by seq',[id])).rows
    const approvals=(await db.query('select id,required_role,requested_by,decided_by,decision,decided_at from approvals where run_id=$1 order by id',[id])).rows
    const audit=(await db.query('select id,actor,action,entity,before,after,at from audit_log where run_id=$1 order by at,id',[id])).rows
    const notes=audit.filter(a=>a.action==='run_rewound').flatMap(a=>a.after?.notes ?? [])
    return { run, steps, approvals, audit, notes }
  })
})
export const contacts = endpoint(async (req: Request) => {
  await actor(req); const {limit,offset}=paging(req), q=new URL(req.url).searchParams
  const filter=z.object({tag:z.string().max(100).nullable(),status:z.enum(['new','engaged','registered','customer']).nullable(),source:z.string().max(100).nullable()})
    .parse({tag:q.get('tag'),status:q.get('status'),source:q.get('source')})
  const rows=(await pool.query(`select id,name,email,phone,tags,source,status,unsubscribed,created_at from contacts
    where ($1::text is null or $1=any(tags)) and ($2::text is null or status=$2) and ($3::text is null or source=$3)
    order by name,id limit $4 offset $5`,[filter.tag,filter.status,filter.source,limit,offset])).rows
  return {contacts:rows,limit,offset}
})
export const timeline = endpoint(async (req: Request, ctx: IdContext) => {
  await actor(req); const id=await idOf(ctx),{limit,offset}=paging(req)
  if (!(await pool.query('select id from contacts where id=$1',[id])).rowCount) throw new HttpError(404,'NOT_FOUND','Contact not found')
  const events=(await pool.query(`select e.id,e.type,e.payload,e.run_id,e.created_at,r.instruction,
    e.payload->>'rule_id' rule_id,e.payload->>'reason' reason from contact_events e left join agent_runs r on r.id=e.run_id
    where e.contact_id=$1 order by e.created_at desc,e.id desc limit $2 offset $3`,[id,limit,offset])).rows
  return {events,limit,offset}
})
export const analyticsSummary = endpoint(async (req: Request) => { await actor(req); return analytics() })
export const outbox = endpoint(async (req: Request) => {
  await actor(req); const {limit,offset}=paging(req),q=new URL(req.url).searchParams
  const f=z.object({status:z.enum(['queued','sent','cancelled','failed']).nullable(),run_id:uuid.nullable(),contact_id:uuid.nullable(),webinar_id:uuid.nullable()})
    .parse({status:q.get('status'),run_id:q.get('run_id'),contact_id:q.get('contact_id'),webinar_id:q.get('webinar_id')})
  const rows=(await pool.query(`select o.id,o.campaign_id,o.contact_id,k.name contact_name,c.kind,c.webinar_id,
    o.payload,o.dispatch_after,o.status,o.cancel_reason,o.dispatched_at
    from outbox o join campaigns c on c.id=o.campaign_id join contacts k on k.id=o.contact_id
    where ($1::text is null or o.status=$1) and ($2::uuid is null or exists (select 1 from run_steps s
      where s.run_id=$2 and s.tool='schedule_campaign' and s.result->'outbox_ids' ? o.id::text))
      and ($3::uuid is null or o.contact_id=$3) and ($4::uuid is null or c.webinar_id=$4)
    order by o.dispatch_after,o.id limit $5 offset $6`,[f.status,f.run_id,f.contact_id,f.webinar_id,limit,offset])).rows
  return {outbox:rows,limit,offset,simulated:true}
})
export const publicPage = endpoint(async (_req: Request, ctx: SlugContext) => {
  const slug=await slugOf(ctx)
  return withTx(async db => {
    await db.query('set transaction isolation level repeatable read, read only')
    const page=(await db.query(`select id,slug,title,blocks,version from pages where slug=$1 and status='published'`,[slug])).rows[0]
    if (!page) throw new HttpError(404,'NOT_FOUND','Page not found')
    const webinar=(await db.query('select id,title,description,starts_at,status from webinars where page_id=$1 order by id limit 1',[page.id])).rows[0] ?? null
    return {page,webinar,registration_open:webinar?.status==='scheduled'}
  })
})
