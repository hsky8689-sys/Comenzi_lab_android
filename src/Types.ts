interface Entity<T>{
    id:T
}
export interface User extends Entity<number>{
    username:string;
}
export interface ApiResponse<T> {
    data: T;
    message:string;
}
export interface Product extends Entity<number>{
    price:number;
    name:string;
    restaurant:number;
}
export interface Order extends Entity<number>{
    orderTime:string;
    products:Product[];
    idempotencyKey?:string;
    totalPrice?:number;
}
// one page from the backend; `last` tells the infinite scroll when to stop
export interface PageResult<T> {
    items: T[];
    page: number;
    last: boolean;
}
export type RestaurantSearchField = "name" | "id";
export interface Restaurant extends Entity<number>{
    name:string;
    adress:string;
    products:Product[];
}