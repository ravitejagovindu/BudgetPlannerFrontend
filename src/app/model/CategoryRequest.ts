export interface CategoryRequest {
    id: number,
    type: string;
    category: string;
    subcategories: string[];
    amount: number;
}
