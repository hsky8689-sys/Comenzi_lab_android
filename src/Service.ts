import axios from "axios";
import {ApiResponse, Order, Restaurant, User} from "./Types";
import log from "./logger";
import {network} from "./Network";
import {useSyncExternalStore} from "react";
import {OrderedItem} from "./components/OrderItems";

const api = axios.create({
   baseURL:"http://localhost:8080",
   headers:{"Content-Type":"application/json"}
});
api.interceptors.request.use(config => {
    const token = localStorage.getItem("jwt");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
let isLogged:boolean = false
export const localStorageService ={
    isUserLogged():boolean{
        const obtained = localStorage.getItem("jwt");
        isLogged =  typeof obtained === 'string' && obtained.length>0
        return isLogged;
    },
    cacheResult(key:string,value:never):void{
        localStorage.setItem(key,value);
    },
    getCached(key:string):string|null{
        return localStorage.getItem(key);
    },
    logout():boolean{
        if(this.isUserLogged()){
            localStorage.removeItem("jwt");
            isLogged=false;
            return true;
        }
        return false;
    },
    storeToken(jwt:string):boolean{
        localStorage.setItem("jwt",jwt);
        return this.isUserLogged();
    },
    toggleStateChange(){

    }
};
export const authService = {
    async signUp(username: string, password: string): Promise<User> {
        const res = await api.post("/users/signup", {"username": username, "password": password});
        return res.data;
    },
    async login(username: string, password: string): Promise<User> {
        try {
            if(network.isOnline()) {
                const res = await api.post("/users/login", {"username": username, "password": password});
                if(res.status===200){
                    localStorageService.storeToken(res.data.jwt);
                }
                return res.data;
            }else{
                log.error("Eroare la login");
                return {username:"",id:0}
            }
        }catch (err){
            log.error(`Eroare la login:${err}`);
            return {username:"",id:0}
        }
    },
    async logout(): Promise<void>{

    }
}
export const orderService = {
    async placeOrder(body:Omit<Order,"id">) : Promise<Order> {
        if(network.isOnline()) {
            const res = await api.post("/orders", body);
            return res.data;
        }else{
            //place in queue
            return null;
        }
    },
    async getUserHistory(page:number,size:number):Promise<Order[]>{
        if(network.isOnline()){
            const res = await api.get(`/orders/history?page=${page}&size=${size}&sort=orderTime,desc`)
            localStorageService.cacheResult(`orders:${page}:${size}`,res.data.orders)
            return res.data.orders;
        }else{
            const cachedMaybe = localStorageService.getCached(`orders:${page}:${size}`) || "";
            if(cachedMaybe.length>0) {
                return JSON.parse(cachedMaybe);
            }
            return []
        }
    },
    async getOrderStats(id:number):Promise<Order[]>{
        if(network.isOnline()){
            const res = await api.get(`/orders/${id}`)
            localStorageService.cacheResult(`orders:${id}`,JSON.stringify(res.data.order))
            return res.data.orders;
        }else{
            const cachedMaybe = localStorageService.getCached(`orders:${page}:${size}`) || "";
            if(cachedMaybe.length>0) {
                return JSON.parse(cachedMaybe);
            }
            return []
        }
    }
}
export const restaurantService = {
    async searchById(id: number): Promise<Restaurant> {
        try {
            if(network.isOnline()) {
                const res = await api.get<ApiResponse<Restaurant>>("/restaurants?id=" + id);
                log.debug("status:", res.status, "data:", res.data.data);
                localStorageService.cacheResult(`restaurant:${id}`,res.data.data)
                return res.data.data;
            }
            else{
                const cachedMaybe = localStorageService.getCached(`restaurant:${id}`) || "";
                if(cachedMaybe.length>0) {
                    return JSON.parse(cachedMaybe);
                }
                return {name:" ",adress:" ",products:[],id:-1};
            }
        } catch (err) {
            log.error("searchById a crapat:", err);
            const cachedMaybe = localStorageService.getCached(`restaurant:${id}`) || "";
            if(cachedMaybe.length>0) {
                return JSON.parse(cachedMaybe);
            }
            return {name:" ",adress:" ",products:[],id:-1};
        }
    },
    async searchByName(name:string):Promise<Restaurant>{
        try {
            const res = await api.query<ApiResponse<Restaurant>>("/restaurants?id=" + name);
            log.debug("status:", res.status, "data:", res.data.data);
            return res.data.data;
        } catch (err) {
            log.error("searchById a crapat:", err);
            throw err;
        }
    }
}
const emit = () => {
    listeners.forEach(l => l())
    localStorageService.cacheResult("cart",JSON.stringify(orderItems));
};
let orderItems = JSON.parse(localStorageService.getCached("cart") || "{}")
export const localOrdersService = {
    deleteItem(id:number):void{
        if(orderItems[id]!==undefined) {
             const { [id]:_, ...rest} = orderItems
             orderItems = rest
             emit()
        }
    },
    dropItem(id:number):void{
        const found = orderItems[id]
        if(found!==undefined){
            const old = orderItems[found.id];
            if(old.quantity>1){
                orderItems = {
                    ...orderItems,
                    [found.id]: { ...old, quantity: old.quantity-1 },
                }
            }
            else {
                const { [id]:_, ...rest} = orderItems
                orderItems = rest
            }
        }
        emit()
    },
    addItem(item:OrderedItem):void{
        const found = orderItems[item.id]
        if(found!==undefined){
            const old = orderItems[found.id];
            orderItems = {
                ...orderItems,
                [found.id]: { ...old, quantity: old.quantity + 1 },
            };
        }
        else orderItems = {
            ...orderItems,
            [item.id]:item
        }
        emit()
    },
    clearOrders():void{
        Object.keys(orderItems).forEach(key => this.deleteItem(key as unknown as number))
        emit()
    },
    getOrders():OrderedItem[]{
        const keys:string[] = Object.keys(orderItems) as string[]
        if(keys===undefined) return []
        return Array.from(keys.map(k=>orderItems[k as unknown as number]))
    }
}
export const useLoginState = () => useSyncExternalStore(
    localStorageService.toggleStateChange,
    localStorageService.isUserLogged
);
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
};
function getSnapshot() {
    return orderItems;
}
export const useOrder = ()=>useSyncExternalStore(subscribe, getSnapshot);