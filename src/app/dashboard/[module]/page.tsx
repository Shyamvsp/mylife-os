import { notFound } from "next/navigation";
import { ModuleWorkspace } from "@/components/module-workspace";
import { isModuleKey, MODULES } from "@/lib/modules";
export default async function ModulePage({params}:{params:Promise<{module:string}>}){const {module}=await params;if(!isModuleKey(module))notFound();return <ModuleWorkspace moduleKey={module} config={MODULES[module]}/>}
