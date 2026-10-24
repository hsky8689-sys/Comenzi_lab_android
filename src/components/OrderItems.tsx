import React, {useMemo} from "react";
import {IonButton, IonCard, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage} from "@ionic/react";
import {Product} from "../Types";
import {localOrdersService, useOrder} from "../Service";

export const nowLocal = (): string => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 19);
};
export interface OrderedItem extends Product{
    quantity:number
}
const OrderItems:React.FC = () =>{
    const order = useOrder();
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
            <IonButton>
                Place order
            </IonButton>
            <IonLabel>Total price:{price}</IonLabel>
        </IonContent>
    </IonPage>
    };

export default OrderItems;