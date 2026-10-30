import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {
    IonButton,
    IonCard,
    IonContent,
    IonHeader,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    useIonToast
} from "@ionic/react";
import {Order, Product} from "../Types";
import {localOrdersService, orderService, useOrder} from "../Service";
import {useNetworkStatus} from "../Network";
import {newIdempotencyKey} from "../idempotency";
import {usePendingOrders} from "../orderQueue";
import {usePagedList} from "../usePagedList";

const HISTORY_PAGE_SIZE = 10;

export const nowLocal = (): string => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 19);
};
export interface OrderedItem extends Product{
    quantity:number
}
const OrderItems:React.FC = () =>{
    const order:OrderedItem[] = useOrder();
    const online = useNetworkStatus()
    const computePrice = () =>{
        let sum = 0;
        Object.values(order).forEach(v=>sum+=v.quantity*v.price)
        return sum;
    }
    const price = useMemo(computePrice,[order])
    const [present] = useIonToast();
    const pendingOrders = usePendingOrders();
    const [enable,setEnabled]=useState(true);
    const tryPlaceOrder = async () => {
        if(price===0){
            present({
                message: "Adăugați mai înainte produse la comandă",
                duration: 2500,
                position: "middle",
                color: "warning",
            })
            return
        }
        setEnabled(false)
        try {
            const prod:Product[] = []
            Object.values(order).forEach(p=>prod.push(p));
            // the key is generated once, here; a queued order keeps it for every retry
            const result = await orderService.placeOrder({orderTime: nowLocal(), products: prod, idempotencyKey: newIdempotencyKey()})
            if(result !== "rejected") localOrdersService.clearOrders()
            if(result === "sent") void reload()
            present({
                message: result === "sent" ? "Comanda a fost trimisă"
                    : result === "queued" ? "Comanda nu a fost trimisă, se trimite automat când revii online"
                    : "Comanda a fost respinsă de server",
                duration: 3000,
                position: "bottom",
                color: result === "sent" ? "success" : result === "queued" ? "warning" : "danger",
            });
        } finally {
            setEnabled(true)
        }
    }
    const placeOrderBtn = <IonButton disabled={!enable} onClick={()=>tryPlaceOrder()}>
            Place order
        </IonButton>
    //apelam functia de istoric per utilizator imediat ce intra in pagina si salvam rezulatul intr-un callback
    const fetchHistoryPage = useCallback((page:number) =>orderService.getUserHistory(page, HISTORY_PAGE_SIZE),
        [])
    const {items: history, last, loadMore, reload} = usePagedList<Order>(fetchHistoryPage, "history")
    // daca ajunge la server o comanda din coada,o afisam in istoric si schimbam ultima lungime cunoscuta a listei de comenzi
    const previousPending = useRef(pendingOrders.length)
    useEffect(() => {
        if(pendingOrders.length < previousPending.current) void reload()
        previousPending.current = pendingOrders.length
    }, [pendingOrders.length, reload])
    return <IonPage className={"orderList"}>
        <IonHeader>
            <IonLabel>My items</IonLabel>
        </IonHeader>
        <IonContent>
            <IonList>{
                Object.values(order).map(i=>
                    <IonItem key={i.name}>
                        <IonLabel>{i.name}</IonLabel>
                        <IonLabel>{i.price} lei</IonLabel>
                        <IonLabel>{i.quantity}</IonLabel>
                        <IonCard>
                            <IonButton onClick={()=>localOrdersService.addItem(i)}>+</IonButton>
                            <IonButton onClick={()=>localOrdersService.dropItem(i.id)}>-</IonButton>
                        </IonCard>
                    </IonItem>)
            }
            </IonList>
            <IonLabel>Total price:{price}</IonLabel>
            {placeOrderBtn}
            {pendingOrders.length > 0 &&
                <IonLabel color="warning">
                    {pendingOrders.length} comenzi netrimise{online ? ", se trimit acum" : ", se trimit când revii online"}
                </IonLabel>}
            <IonButton onClick={()=>orderService.getOrderStats(22)}>command id test</IonButton>
            <IonCard>User history</IonCard>
            <IonList>
                {history.length === 0 && <IonItem><IonLabel>Nicio comandă încă</IonLabel></IonItem>}
                {history.map(item=>
                    <IonItem key={item.id}>
                        <IonLabel>{item.orderTime.replace("T", " ").slice(0, 16)}</IonLabel>
                        <IonLabel slot="end">{item.products.length} produse</IonLabel>
                    </IonItem>)
                }
            </IonList>
            <IonInfiniteScroll disabled={last}
                               onIonInfinite={async (event) => {
                                   await loadMore();
                                   await event.target.complete();
                               }}>
                <IonInfiniteScrollContent loadingText="Se încarcă comenzile mai vechi..."/>
            </IonInfiniteScroll>
        </IonContent>
    </IonPage>
    };

export default OrderItems;