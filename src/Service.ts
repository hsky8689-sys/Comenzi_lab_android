import axios from "axios";
import {ApiResponse, Order, PageResult, Restaurant, RestaurantSearchField, User} from "./Types";
import log from "./logger";
import {network} from "./Network";
import {useSyncExternalStore} from "react";
import {OrderedItem} from "./components/OrderItems";
import {orderQueue, PendingOrder, SendResult} from "./orderQueue";

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
const authListeners = new Set<() => void>();
const notifyAuthChange = () => authListeners.forEach(l => l());
export const localStorageService ={
    isUserLogged():boolean{
        const obtained = localStorage.getItem("jwt");
        isLogged =  typeof obtained === 'string' && obtained.length>0
        return isLogged;
    },
    cacheResult(key:string,value:string):void{
        localStorage.setItem(key,value);
    },
    getCached(key:string):string|null{
        return localStorage.getItem(key);
    },
    logout():boolean{
        if(this.isUserLogged()){
            localStorage.removeItem("jwt");
            isLogged=false;
            notifyAuthChange();
            return true;
        }
        return false;
    },
    storeToken(jwt:string):boolean{
        localStorage.setItem("jwt",jwt);
        notifyAuthChange();
        return this.isUserLogged();
    },
    toggleStateChange(listener: () => void){
        authListeners.add(listener);
        return () => { authListeners.delete(listener); };
    }
};
export const authService = {
    // returns null on success, otherwise the message to show
    async signUp(username: string, password: string, email: string): Promise<string | null> {
        if (!network.isOnline()) return "Ai nevoie de internet ca să-ți faci cont";
        try {
            await api.post("/users/signup", {username, password, email});
            return null;
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.message) return err.response.data.message;
            log.error(`Eroare la signup:${err}`);
            return "Contul nu a putut fi creat";
        }
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
    logout(): void{
        localStorageService.logout();
    }
}
const sendOrder = async (order: PendingOrder): Promise<SendResult> => {
    try {
        await api.post("/orders", order);
        return "sent";
    } catch (err) {
        const status = axios.isAxiosError(err) ? err.response?.status : undefined;
        // no response = offline/server down; 5xx = server problem; 401/403 = token expired
        if (status === undefined || status >= 500 || status === 401 || status === 403) return "retry";
        return "rejected";
    }
};
orderQueue.setSender(sendOrder);

export const orderService = {
    // "queued" = stored locally, sent automatically when we are back online
    async placeOrder(body: PendingOrder): Promise<"sent" | "queued" | "rejected"> {
        if (network.isOnline()) {
            const result = await sendOrder(body);
            if (result !== "retry") return result;
        }
        orderQueue.enqueue(body);
        return "queued";
    },
    async getUserHistory(page:number,size:number):Promise<PageResult<Order>>{
        return cachedPage(`orders:${page}:${size}`, page, async () => {
            const res = await api.get(`/orders/history?page=${page}&size=${size}&sort=orderTime,desc`)
            return {items: res.data.orders, page: res.data.page, last: res.data.last};
        });
    },
    async getOrderStats(id:number):Promise<Order|null>{
        const key = `order:${id}`;
        try {
            if(network.isOnline()){
                const res = await api.get(`/orders/orderId?orderId=${id}`)
                localStorageService.cacheResult(key,JSON.stringify(res.data.order))
                return res.data.order;
            }
        } catch (err) {
            log.error("getOrderStats a crapat:", err);
        }
        const cachedMaybe = localStorageService.getCached(key);
        return cachedMaybe ? JSON.parse(cachedMaybe) : null;
    }
}
// online: ask the backend and remember the page in localStorage;
// offline or request failed: give back the remembered page (or an empty last page)
async function cachedPage<T>(key: string, page: number, fetchOnline: () => Promise<PageResult<T>>): Promise<PageResult<T>> {
    try {
        if (network.isOnline()) {
            const result = await fetchOnline();
            localStorageService.cacheResult(key, JSON.stringify(result));
            return result;
        }
    } catch (err) {
        log.error(`GET pentru ${key} a crapat:`, err);
    }
    const cachedMaybe = localStorageService.getCached(key);
    return cachedMaybe ? JSON.parse(cachedMaybe) : {items: [], page, last: true};
}
export const restaurantService = {
    async searchById(id: number): Promise<Restaurant> {
        try {
            if(network.isOnline()) {
                const res = await api.get<ApiResponse<Restaurant>>("/restaurants?id=" + id);
                log.debug("status:", res.status, "data:", res.data.data);
                localStorageService.cacheResult(`restaurant:${id}`,JSON.stringify(res.data.data))
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
    async search(by:RestaurantSearchField, value:string, page:number, size:number):Promise<PageResult<Restaurant>>{
        const params = new URLSearchParams({by, value, page: String(page), size: String(size)});
        return cachedPage(`restaurants:${params}`, page, async () => {
            const res = await api.get(`/restaurants/search?${params}`);
            return {items: res.data.restaurants, page: res.data.page, last: res.data.last};
        });
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