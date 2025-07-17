import { Projections } from "./projections";

export class OverViewChartData {

  constructor(
    public balanceProjected: number,
    public balanceActual: number,
    public balanceDifference: number,
    public projectionsByType: Projections[],
  ) {}
}
