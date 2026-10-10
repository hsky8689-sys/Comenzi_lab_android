import axios from "axios";
import {ApiResponse, Order, Restaurant, User} from "./Types";
import log from "./logger";
import OrderItems from "./components/OrderItems";


const api = axios.create({
   baseURL:"http://localhost:8080",
   headers:{"Content-Type":"application/json"}
});
export const authService = {
    async signUp(username: string, password: string): Promise<User> {
        const res = await api.post("/signup", {"username": username, "password": password});
        return res.data;
    },
    async login(username: string, password: string): Promise<User> {
        const res = await api.post("/login", {"username": username, "password": password});
        return res.data;
    }
}
export const orderService = {
    async placeOrder(body:Omit<Order,"id">) : Promise<Order> {
         const res = await api.post("/orders",body);
         return res.data;
    }
}
export const restaurantService = {
    async searchById(id: number): Promise<Restaurant> {
        try {
            const res = await api.get<ApiResponse<Restaurant>>("/restaurants?id=" + id);
            log.debug("status:", res.status, "data:", res.data.data);
            return res.data.data;
        } catch (err) {
            log.error("searchById a crapat:", err);
            throw err;
        }
    }
}