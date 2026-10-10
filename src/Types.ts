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
    userId:number;
    orderTime:string;
    products:Product[];
}
export interface Restaurant extends Entity<number>{
    name:string;
    adress:string;
    products:Product[];
}