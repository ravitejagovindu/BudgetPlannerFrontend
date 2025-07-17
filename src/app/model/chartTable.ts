export class ChartTable {

  constructor(
    public year: number,
    public month: string,
    public type: string,
    public category: string,
    public projected: number,
    public actual: number,
    public difference: number,
  ) {}
}
