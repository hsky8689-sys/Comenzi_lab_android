import React, {useEffect, useState} from "react";
import {IonButton, IonCard, IonContent, IonHeader, IonItem, IonLabel, IonList, IonPage} from "@ionic/react";
import {Order, Product} from "../Types";
import {orderService} from "../Service";
import {OrderProps} from "../App";
import {Client} from "@stomp/stompjs";

export const nowLocal = (): string => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60_000;
    return new Date(now.getTime() - offsetMs).toISOString().slice(0, 19);
};
export interface OrderedItem extends Product{
    quantity:number
}
const OrderItems:React.FC<OrderProps> = ({order,setOrder}) =>{
    const [price,setPrice] = useState(0);
    useEffect(() => {
            let cost = 0;
            order.forEach(i=>cost+=i.price*i.quantity);
            setPrice(cost);
    },[order]);
    const handleAdd = (p:Product)=> {
        const newItems = order.find(pr=>pr.id===p.id) ?
                            order.map(i=>i.id===p.id ? {id:i.id,name:i.name,price:i.price,restaurant:i.restaurant,quantity:i.quantity+1} : i):
                            [...order,{...p,quantity:1}];
        setOrder(newItems);
    }
    const handleDelete = (p:Product)=> {
        const newItems = order.map(i=> i.id!== p.id ? i :
                {id:i.id,name:i.name,price:i.price,restaurant:i.restaurant,quantity:i.quantity-1})
                .filter(i=>i.quantity>0)
        setOrder(newItems);
    }
    useEffect(() => {
        const client = new Client({brokerURL: "ws://localhost:8080/mywebsockets/websocket"});
        client.onConnect = () => {
            client.subscribe("/products", (msg) => {
                const body = JSON.parse(msg.body);
                const prod: Product = body.innerDto;
                const operation: string = body.operation;
                switch (operation) {
                        case "ADDITION":
                            handleAdd(prod);
                            break;
                        case "DELETION":
                            handleDelete(prod);
                            break;
                        default:
                            console.log("dubios");
                    }
            });
        };
        client.activate();
        return () => client.deactivate();
    }, [order, setOrder]);
    const handleOrder = async () =>{
        const products = order.map(i=>(
            {id:i.id,name:i.name,restaurant:i.restaurant,price:i.price}
            ));
        const body:Omit<Order, "id"> = {
            userId:1,
            orderTime:nowLocal(),
            products:products
        }
        const resp = await orderService.placeOrder(body);
        if(resp.id !== undefined) setOrder([]);
    };
    return <IonPage className={"orderList"}>
        <IonHeader>
            <IonLabel>My items</IonLabel>
        </IonHeader>
        <IonContent>
            <IonList>{
                order.map(i=>
                    <IonItem key={i.name}>
                        <IonLabel>{i.name}</IonLabel>
                        <IonLabel>{i.price} lei</IonLabel>
                        <IonLabel>{i.quantity}</IonLabel>
                        <IonCard>
                            <IonButton onClick={()=>handleAdd(i.name)}>+</IonButton>
                            <IonButton onClick={()=>handleDelete(i.name)}>-</IonButton>
                        </IonCard>
                    </IonItem>)
            }
            </IonList>
            <IonButton onClick={handleOrder}>
                Place order
            </IonButton>
            <IonLabel>Total price:{price}</IonLabel>
        </IonContent>
    </IonPage>
    };

export default OrderItems;