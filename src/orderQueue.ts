import {useSyncExternalStore} from "react";
import {Order} from "./Types";
import {network} from "./Network";
import log from "./logger";

export type PendingOrder = Omit<Order, "id"> & { idempotencyKey: string };
export type SendResult = "sent" | "retry" | "rejected";

const STORAGE_KEY = "pendingOrders";

const load = (): PendingOrder[] => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    } catch {
        return [];
    }
};

let pending: PendingOrder[] = load();
const listeners = new Set<() => void>();
const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(pending));
    listeners.forEach(l => l());
};

let sender: ((order: PendingOrder) => Promise<SendResult>) | null = null;
let flushing = false;

export const orderQueue = {
    setSender(send: (order: PendingOrder) => Promise<SendResult>) {
        sender = send;
        if (network.isOnline()) void this.flush();
    },
    enqueue(order: PendingOrder) {
        if (pending.some(p => p.idempotencyKey === order.idempotencyKey)) return;
        pending = [...pending, order];
        save();
    },
    async flush() {
        if (flushing || !sender) return;
        flushing = true;
        try {
            while (pending.length > 0 && network.isOnline()) {
                const next = pending[0];
                const result = await sender(next);
                if (result === "retry") break;
                if (result === "rejected") log.error("Comanda respinsa de server:", next.idempotencyKey);
                pending = pending.filter(p => p.idempotencyKey !== next.idempotencyKey);
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
    if (network.isOnline()) void orderQueue.flush();
});

export const usePendingOrders = () =>
    useSyncExternalStore(orderQueue.subscribe, orderQueue.getPending);
