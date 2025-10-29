export class MutualFundHolding {
  constructor(
    public tradingSymbol: string,
    public fund: string,
    public folio: string,
    public quantity: number,
    public averagePrice: number,
    public lastPrice: number,
    public pnl: number
  ) {}
}
