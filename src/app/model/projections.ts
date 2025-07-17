export class Projections {

  constructor(
    public type: string,
    public projected: number,
    public actual: number,
    public difference: number,
  ) {}
}
