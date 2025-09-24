import { Projections } from "./projections";

export class IndividualBalances {

  constructor(
    public name: string,
    public income: number,
    public spent: number,
    public balance: number,
  ) {}
}
