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
    IonNote,
    IonPage,
    IonPopover,
    IonSelectOption, IonThumbnail, IonToast,
    useIonToast
} from "@ionic/react";
import {Order, Product, Restaurant} from "../Types";
import {localOrdersService, localStorageService, orderService, useOrder} from "../Service";
import {useNetworkStatus} from "../Network";
import {newIdempotencyKey} from "../idempotency";
import {usePendingOrders} from "../orderQueue";
import {usePagedList} from "../usePagedList";
import "./OrderItems.css";

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
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<Order | null>(null);
    // click-ul pe comanda, ca popover-ul sa apara langa ea
    const [popoverEvent, setPopoverEvent] = useState<Event | undefined>(undefined);
    const showDetails = async (e: React.MouseEvent, item: Order) => {
        setPopoverEvent(e.nativeEvent);
        setSelected(item); // aratam imediat ce avem din istoric, totalul vine de pe backend
        setOpen(true);
        const details = await orderService.getOrderStats(item.id);
        // daca intre timp a dat tap pe alta comanda, nu suprascriem
        if (details) setSelected(prev => prev?.id === details.id ? details : prev);
    }
    const tryPlaceOrder = async () => {
        if(price===0){
            await present({
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
            <IonCard>User history</IonCard>
            <IonList>
                {history.length === 0 && <IonItem><IonLabel>Nicio comandă încă</IonLabel></IonItem>}
                {history.map(item=>
                    <IonItem key={item.id} button detail onClick={(e) => showDetails(e, item)}>
                        <IonLabel>{item.orderTime.replace("T", " ").slice(0, 16)}</IonLabel>
                        <div slot="end" className={"historyThumbs"}>
                            {item.products.slice(0, 4).map(p => p.image &&
                                <img key={p.id} alt={p.name} src={p.image}/>)}
                        </div>
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
            {/* popover si nu modal: nu acopera pagina si se inchide singur la tap in afara lui;
                fara onDidDismiss, `open` ar ramane true si nu s-ar mai redeschide */}
            <IonPopover isOpen={open} event={popoverEvent} showBackdrop={false}
                        className={"orderDetails"}
                        onDidDismiss={() => setOpen(false)}>
                <IonContent>
                    <IonList lines="none">
                        {selected?.products.map(p =>
                            <IonItem key={p.id}>
                                {p.image &&
                                    <IonThumbnail slot="start">
                                        <img alt={p.name} src={p.image} style={{borderRadius:"8px"}}/>
                                    </IonThumbnail>}
                                <IonLabel>
                                    {p.name}
                                    <p>{p.quantity ?? 1} × {p.price} lei</p>
                                </IonLabel>
                                <IonNote slot="end">{(p.quantity ?? 1) * p.price} lei</IonNote>
                            </IonItem>)}
                        <IonItem>
                            <IonLabel><strong>Total</strong></IonLabel>
                            <IonNote slot="end">
                                <strong>{selected?.totalPrice !== undefined ? `${selected.totalPrice} lei` : "..."}</strong>
                            </IonNote>
                        </IonItem>
                    </IonList>
                </IonContent>
            </IonPopover>
        </IonContent>
    </IonPage>
    };

export default OrderItems;