import {network} from "./Network";
import log from "./logger";
import {
    PendingRestaurantAddOperation,
    PendingRestaurantDeleteOperation,
    PendingRestaurantOperation,
    SendResult
} from "./orderQueue";
import {useSyncExternalStore} from "react";

const RESTAURANTS_KEY:string = "pendingRestaurantOperations";
const load = ()=>{
    try {
        return JSON.parse(localStorage.getItem(RESTAURANTS_KEY) || "[]");
    } catch {
        return [];
    }
}
let pending: (PendingRestaurantAddOperation|PendingRestaurantDeleteOperation)[] = load();
const listeners = new Set<() => void>();
const save = () => {
    localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(pending));
    listeners.forEach(l => l());
};
let sender: ((order: PendingRestaurantOperation) => Promise<SendResult>) | null = null;
let flushing = false;
export const restaurantCrudQueue = {
    setSender(send: (order: PendingRestaurantOperation) => Promise<SendResult>) {
        sender = send;
        if (network.isOnline()) void this.flush();
    },
    save(){
      try{
          localStorage.setItem(RESTAURANTS_KEY, JSON.stringify(pending));
          listeners.forEach(l => l());
      } catch (e){
          console.log(e)
      }
    },
    enqueue(order: PendingRestaurantAddOperation|PendingRestaurantDeleteOperation) {
        pending = [...pending,order];
        this.save();
    },
    async flush() {
        if (flushing || !sender) return;
        flushing = true;
        try {
            while (pending.length > 0 && network.isOnline()) {
                const next = pending[0];
                const result = await sender(next);
                if (result === "retry") break;
                if (result === "rejected") log.error("Operatie respinsa de server:");
                //pending = pending.filter(p => p.idempotencyKey !== next.idempotencyKey);
                save();
            }
        } finally {
            flushing = false;
        }
    },
    getPending: () => pending,
    subscribe(listener: () => void) {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },
};
network.subscribe(() => {
    if (network.isOnline()) void restaurantCrudQueue.flush();
});
export const usePendingRestaurantOperations = () =>
    useSyncExternalStore(restaurantCrudQueue.subscribe,restaurantCrudQueue.getPending);