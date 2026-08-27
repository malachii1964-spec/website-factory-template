export interface ContextBranch {
  id: string;
  parentId?: string;
  branchPoint: string;
  contextDigest: string;
  goal: string;
  createdAt: string;
}

export class BranchGraph {
  private branches = new Map<string,ContextBranch>();
  addRoot(branch: ContextBranch): void {
    if (branch.parentId) throw new Error("root_cannot_have_parent");
    if (this.branches.has(branch.id)) throw new Error("duplicate_branch_id");
    this.branches.set(branch.id,{...branch});
  }
  branch(parentId:string, child:Omit<ContextBranch,"parentId">): ContextBranch {
    if (!this.branches.has(parentId)) throw new Error("parent_not_found");
    if (this.branches.has(child.id)) throw new Error("duplicate_branch_id");
    const next={...child,parentId}; this.branches.set(next.id,next); return {...next};
  }
  get(id:string):ContextBranch|undefined { const x=this.branches.get(id); return x?{...x}:undefined; }
  lineage(id:string):ContextBranch[] {
    const out:ContextBranch[]=[]; let cur=this.branches.get(id);
    while(cur){ out.unshift({...cur}); cur=cur.parentId?this.branches.get(cur.parentId):undefined; }
    return out;
  }
}
