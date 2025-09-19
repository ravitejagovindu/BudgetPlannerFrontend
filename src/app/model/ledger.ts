export class Ledger {
  constructor(
    public id: number,
    public year: number,
    public month: string,
    public date: Date,
    public type: string,
    public category: string,
    public subCategory: string,
    public amount: number,
    public paidBy: string,
    public canEdit: boolean = false
  ) {}
}
