import Link from "next/link";
import { ruleCatalogue } from "@/lib/rule-catalogue";
export function RuleId({id}: {id:string}) {
  return <><Link className="rule-id" href={"/rules#"+encodeURIComponent(id)}><code>{id}</code></Link>{!ruleCatalogue[id] && <small>Recorded ID; behavior is not confirmed in the rule catalogue. Read the recorded reason and evidence.</small>}</>;
}
