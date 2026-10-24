import React, {useCallback, useEffect, useMemo, useState} from "react";
import {
    IonButton,
    IonCard,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonPage,
    IonToast,
    useIonToast
} from "@ionic/react";
import {Product} from "../Types";
import {localOrdersService, localStorageService, orderService, useOrder} from "../Service";
import {useNetworkStatus} from "../Network";
import {remove} from "ionicons/icons";

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
    const handleAdd= (item:OrderedItem) => {
        localOrdersService.addItem(item)
    }
    const handleDrop= (item:OrderedItem) => {
        localOrdersService.dropItem(item.id)
    }
    const [present] = useIonToast();
    const [enable,setEnabled]=useState(true);
    useEffect(() => {setEnabled(online)},
        [online]
    )
    const tryPlaceOrder = async () => {
        if(price===0){
            present({
                message: "Adăugați mai înainte produse la comandă",
                duration: 2500,
                position: "center",
                color: "warning",
            })
            return
        }
        if(online) {
            const prod:Product[] = []
            Object.values(order).forEach(p=>prod.push(p));
            await orderService.placeOrder({orderTime: nowLocal(), products: prod})
                .then(() => setEnabled(false))
                .finally(() => {
                    localOrdersService.clearOrders()
                    setEnabled(true)
                })
        }else{
            setEnabled(false);
            present({
                message: "Comanda e în așteptare, se trimite când revii online",
                duration: 3000,
                position: "bottom",
                color: "warning",
            });
        }
    }
    const placeOrderBtn =
        <IonButton disabled={!enable}
                   onClick={()=>tryPlaceOrder()}>
            Place order
        </IonButton>
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
                            <IonButton onClick={()=>handleAdd(i)}>+</IonButton>
                            <IonButton onClick={()=>handleDrop(i)}>-</IonButton>
                        </IonCard>
                    </IonItem>)
            }
            </IonList>
            {placeOrderBtn}
            <IonLabel>Total price:{price}</IonLabel>
        </IonContent>
    </IonPage>
    };

export default OrderItems;