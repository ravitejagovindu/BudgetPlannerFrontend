export class PortfolioHolding {
  constructor(
    public tradingSymbol: string,
    public exchange: string,
    public isin: string,
    public quantity: number,
    public t1Quantity: number,
    public realisedQuantity: string,
    public averagePrice: number,
    public lastPrice: number,
    public closePrice: number,
    public pnl: number,
    public dayChange: number,
    public dayChangePercentage: number,
    public product: string
  ) {}
}
