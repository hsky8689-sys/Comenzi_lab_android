import React, {useCallback, useState} from "react";
import {restaurantService} from "../Service";
import {
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    useIonToast
} from "@ionic/react";
import {usePagedList} from "../usePagedList";
import {PageResult, Restaurant} from "../Types";

const PAGE_SIZE = 5;
const resetKey = "nothing_to_reset_here"


const ProductCrud: React.FC = (restaurant: number, _name: string = "", _price: number|null) => {
    const [name, setName] = useState(_name);
    const [price, setPrice] = useState<null|number>(_price);
    const trySetPrice = (v:string) => {
        if (typeof parseInt(v) === "number") setPrice(parseInt(v));
    }
    return <IonCard>
        <IonInput placeholder={'Set a name for the product...'} value={name}
                  onInput={(e) => setName(e.target.value)}></IonInput>
        <IonInput placeholder={'Set a price for the product....'} value={price}
                  onInput={(e) => trySetPrice(e.target.value)}></IonInput>
        <IonButton>{(_name !== "" && _price !== null) ? 'Add product' : 'Modify product'}</IonButton>
    </IonCard>
}
const UserRestaurants: React.FC = () => {
    const [present] = useIonToast();
    const tryAddRestaurant = async () => {
        const res = await restaurantService.addNewRestaurant(null);
        present({
            message: `Restaurantul ${res ? '' : 'nu'} a fost adaugat in aplicatie`,
            duration: 2500,
            position: "middle",
            color: res ? "medium" : "warning",
        })
        return
    };
    const fetchPage = useCallback((page: number): Promise<PageResult<Restaurant>> => {
        return restaurantService.getUserRestaurants(page, PAGE_SIZE);
    }, []);
    const {items: restaurants, last, loadMore} = usePagedList(fetchPage, resetKey);
    return <IonPage>
        <IonContent>
            {restaurants.length !==0 ?
                restaurants.map(r => (
                    <IonCard key={r.id}>
                        <IonCardHeader>
                            <IonCardTitle>{r.name}</IonCardTitle>
                            <IonCardSubtitle>{r.adress}</IonCardSubtitle>
                        </IonCardHeader>
                        <IonList>
                            {r.products.map(p => (
                                <IonItem key={r.id+" "+p.id}>
                                    <IonLabel>{p.name}</IonLabel>
                                    <IonNote slot="end">{p.price} lei</IonNote>
                                </IonItem>
                            ))}
                        </IonList>
                        <ProductCrud restaurant={r.id}/>
                    </IonCard>
                )):<IonCard>
                    Nu aveti restaurante inregistrate,adaugati unul
                </IonCard>}
            <IonInfiniteScroll disabled={last}
                               onIonInfinite={async (event) => {
                                   await loadMore();
                                   await event.target.complete();
                               }}>
                <IonInfiniteScrollContent loadingText="Se încarcă mai multe restaurante..."/>
            </IonInfiniteScroll>
        </IonContent>
    </IonPage>
}

export default UserRestaurants;