export class Planner {

  constructor(
    public baseId: number,
    public updatedId: number,
    public year: number,
    public month: string,
    public category: string,
    public type: string,
    public projected: number,
    public duration: string,
    public canEdit: boolean = false
  ) {}
}
