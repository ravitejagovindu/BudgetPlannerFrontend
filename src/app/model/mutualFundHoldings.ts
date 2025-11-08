export class MutualFundHolding {
  constructor(
    public tradingSymbol: string,
    public fund: string,
    public folio: string,
    public quantity: number,
    public averagePrice: number,
    public investedAmount: number,
    public lastPrice: number,
    public currentValue: number,
    public pnl: number,
    public pnlPercentage: number
  ) {}
}
