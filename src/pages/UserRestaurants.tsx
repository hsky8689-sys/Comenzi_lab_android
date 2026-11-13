import React, {useCallback, useState} from "react";
import {productsService, restaurantService} from "../Service";
import {
    IonButton,
    IonButtons,
    IonCard,
    IonCardContent,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonInput,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonThumbnail,
    useIonAlert,
    useIonToast
} from "@ionic/react";
import {createOutline, locationOutline, trashOutline} from "ionicons/icons";
import {usePagedList} from "../usePagedList";
import {GeoLocation, PageResult, Product, Restaurant} from "../Types";
import PhotoPicker, {PickedPhoto, photoToBlob} from "../components/PhotoPicker";
import StoredImage from "../components/StoredImage";
import MapModal from "../components/MapModal";
import {photoStorage} from "../photoStorage";
import {alertEnter, alertLeave, shake} from "../animations";
import '../theme/UserRestaurants.css';

const PAGE_SIZE = 5;
const resetKey = "nothing_to_reset_here"

type ShowToast = (message: string, ok: boolean) => void;

// poza aleasa se salveaza intai pe device (ramane chiar daca upload-ul pica), apoi se urca pe server
const keepAndUpload = async (key: string, photo: PickedPhoto, upload: (blob: Blob) => Promise<unknown>) => {
    const blob = await photoToBlob(photo);
    await photoStorage.save(key, blob);
    return (await upload(blob)) !== null;
};

const RestaurantForm: React.FC<{ editing: Restaurant | null, onDone: () => void, toast: ShowToast }> =
    ({editing, onDone, toast}) => {
    const [name, setName] = useState(editing?.name ?? "");
    const [adress, setAdress] = useState(editing?.adress ?? "");
    const [location, setLocation] = useState<GeoLocation | null>(editing?.location ?? null);
    const [mapOpen, setMapOpen] = useState(false);
    const [photo, setPhoto] = useState<PickedPhoto | null>(null);
    const [busy, setBusy] = useState(false);
    const save = async () => {
        if (!name.trim() || !adress.trim()) return toast("Completează numele și adresa", false);
        setBusy(true);
        try {
            const body = {name: name.trim(), adress: adress.trim(), location};
            const saved = editing
                ? await restaurantService.updateRestaurant(editing.id, body)
                : await restaurantService.addRestaurant(body);
            if (!saved) return toast("Restaurantul nu a putut fi salvat (ești online?)", false);
            if (photo && !(await keepAndUpload(`restaurant-${saved.id}`, photo,
                    blob => restaurantService.uploadImage(saved.id, blob)))) {
                toast("Restaurantul s-a salvat, dar poza e doar pe telefon", false);
            } else {
                toast(editing ? "Restaurant modificat" : "Restaurant adăugat", true);
            }
            onDone();
        } finally {
            setBusy(false);
        }
    };
    return <IonCard>
        <IonCardHeader>
            <IonCardTitle>{editing ? `Modifici: ${editing.name}` : "Restaurant nou"}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
            <IonInput label="Nume" labelPlacement="stacked" value={name}
                      onIonInput={e => setName(e.detail.value ?? "")}/>
            <IonInput label="Adresă" labelPlacement="stacked" value={adress}
                      onIonInput={e => setAdress(e.detail.value ?? "")}/>
            <PhotoPicker current={editing?.image} picked={photo} onPicked={setPhoto}/>
            <IonButton fill="outline" onClick={() => setMapOpen(true)}>
                <IonIcon slot="start" icon={locationOutline}/>
                {location ? `${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)}` : "Alege locația pe hartă"}
            </IonButton>
            <MapModal isOpen={mapOpen} title={"Atinge harta unde e restaurantul"} location={location}
                      onClose={() => setMapOpen(false)} onConfirm={setLocation}/>
            <IonButton disabled={busy} onClick={save}>{editing ? "Modifică" : "Adaugă"}</IonButton>
            {editing && <IonButton fill="clear" color="medium" onClick={onDone}>Anulează</IonButton>}
        </IonCardContent>
    </IonCard>;
};

const ProductForm: React.FC<{ restaurant: number, editing: Product | null, onDone: () => void, toast: ShowToast }> =
    ({restaurant, editing, onDone, toast}) => {
    const [name, setName] = useState(editing?.name ?? "");
    const [price, setPrice] = useState(editing ? String(editing.price) : "");
    const [photo, setPhoto] = useState<PickedPhoto | null>(null);
    const [busy, setBusy] = useState(false);
    const save = async () => {
        const parsedPrice = Number(price);
        if (!name.trim() || !Number.isInteger(parsedPrice) || parsedPrice <= 0)
            return toast("Numele e obligatoriu, iar prețul un număr întreg pozitiv", false);
        setBusy(true);
        try {
            const body = {name: name.trim(), price: parsedPrice};
            const saved = editing
                ? await productsService.updateProduct(editing.id, body)
                : await productsService.addProduct({...body, restaurant});
            if (!saved) return toast("Produsul nu a putut fi salvat (ești online?)", false);
            if (photo && !(await keepAndUpload(`product-${saved.id}`, photo,
                blob => productsService.uploadImage(saved.id, blob)))) {
                toast("Produsul s-a salvat, dar poza e doar pe telefon", false);
            } else {
                toast(editing ? "Produs modificat" : "Produs adăugat", true);
            }
            onDone();
        } finally {
            setBusy(false);
        }
    };
    return <div className={"productForm"}>
        <IonLabel><strong>{editing ? `Modifici: ${editing.name}` : "Produs nou"}</strong></IonLabel>
        <IonInput label="Nume" labelPlacement="stacked" value={name}
                  onIonInput={e => setName(e.detail.value ?? "")}/>
        <IonInput label="Preț (lei)" labelPlacement="stacked" type="number" inputmode="numeric" value={price}
                  onIonInput={e => setPrice(e.detail.value ?? "")}/>
        <PhotoPicker current={editing?.image} picked={photo} onPicked={setPhoto}/>
        <IonButton size="small" disabled={busy} onClick={save}>{editing ? "Modifică produsul" : "Adaugă produs"}</IonButton>
        {editing && <IonButton size="small" fill="clear" color="medium" onClick={onDone}>Anulează</IonButton>}
    </div>;
};

const UserRestaurants: React.FC = () => {
    const [present] = useIonToast();
    const [confirm] = useIonAlert();
    const [editingRestaurant, setEditingRestaurant] = useState<Restaurant | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const toast: ShowToast = (message, ok) => void present({
        message, duration: 2500, position: "middle", color: ok ? "success" : "warning",
    });
    const fetchPage = useCallback((page: number): Promise<PageResult<Restaurant>> => {
        return restaurantService.getUserRestaurants(page, PAGE_SIZE);
    }, []);
    const {items: restaurants, last, loadMore, reload} = usePagedList(fetchPage, resetKey);
    const afterSave = () => {
        setEditingRestaurant(null);
        setEditingProduct(null);
        void reload();
    };
    const askDelete = (what: string, remove: () => Promise<boolean>) => confirm({
        header: `Ștergi ${what}?`,
        // inlocuim animatia implicita de deschidere / inchidere a alertei cu a noastra
        enterAnimation: alertEnter,
        leaveAnimation: alertLeave,
        buttons: [
            {text: "Nu", role: "cancel"},
            {
                text: "Da, șterge", role: "destructive", handler: async () => {
                    const ok = await remove();
                    toast(ok ? `Am șters ${what}` : `Nu am putut șterge ${what}`, ok);
                    if (ok) afterSave();
                }
            },
        ],
    });
    return <IonPage>
        <IonContent>
            <RestaurantForm key={editingRestaurant?.id ?? "new"} editing={editingRestaurant}
                            onDone={afterSave} toast={toast}/>
            {restaurants.length === 0 &&
                <IonCard><IonCardContent>Nu aveți restaurante înregistrate, adăugați unul</IonCardContent></IonCard>}
            {restaurants.map(r => (
                <IonCard key={r.id}>
                    <StoredImage photoKey={`restaurant-${r.id}`} src={r.image} alt={r.name} className={"restaurantImage"}/>
                    <IonCardHeader>
                        <IonButtons className={"cardActions"}>
                            <IonButton onClick={() => setEditingRestaurant(r)}>
                                <IonIcon slot="icon-only" icon={createOutline}/>
                            </IonButton>
                            <IonButton color="danger"
                                       onClick={async (e) => {
                                           await shake(e.currentTarget); // intai tremura, apoi intreaba
                                           void askDelete(`restaurantul ${r.name}`, async () => {
                                               const ok = await restaurantService.deleteRestaurant(r.id);
                                               if (ok) await photoStorage.remove(`restaurant-${r.id}`);
                                               return ok;
                                           });
                                       }}>
                                <IonIcon slot="icon-only" icon={trashOutline}/>
                            </IonButton>
                        </IonButtons>
                        <IonCardTitle>{r.name}</IonCardTitle>
                        <IonCardSubtitle>{r.adress}</IonCardSubtitle>
                    </IonCardHeader>
                    <IonList>
                        {r.products.map(p => (
                            // tap pe produs = il incarcam in formularul de produs al restaurantului
                            <IonItem key={p.id} button detail={false}
                                     color={editingProduct?.id === p.id ? "light" : undefined}
                                     onClick={() => setEditingProduct(p)}>
                                {p.image &&
                                    <IonThumbnail slot="start">
                                        <StoredImage photoKey={`product-${p.id}`} src={p.image} alt={p.name}/>
                                    </IonThumbnail>}
                                <IonLabel>{p.name}</IonLabel>
                                <IonNote slot="end">{p.price} lei</IonNote>
                                <IonButton slot="end" fill="clear" color="danger"
                                           onClick={async e => {
                                               e.stopPropagation(); // altfel tap-ul selecteaza si produsul
                                               await shake(e.currentTarget);
                                               void askDelete(`produsul ${p.name}`, async () => {
                                                   const ok = await productsService.deleteProduct(p.id);
                                                   if (ok) await photoStorage.remove(`product-${p.id}`);
                                                   return ok;
                                               });
                                           }}>
                                    <IonIcon slot="icon-only" icon={trashOutline}/>
                                </IonButton>
                            </IonItem>
                        ))}
                    </IonList>
                    <IonCardContent>
                        {/* un singur produs editat in toata pagina: doar restaurantul lui primeste editing */}
                        <ProductForm restaurant={r.id}
                                     key={editingProduct?.restaurant === r.id ? editingProduct.id : "new"}
                                     editing={editingProduct?.restaurant === r.id ? editingProduct : null}
                                     onDone={afterSave} toast={toast}/>
                    </IonCardContent>
                </IonCard>
            ))}
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
