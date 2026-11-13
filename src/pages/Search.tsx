import {
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonInput,
    IonIcon,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonSearchbar,
    IonSelect,
    IonSelectOption,
    IonThumbnail,
    IonTitle,
    IonToolbar
} from "@ionic/react";
import {locationOutline, searchCircle, trashSharp} from "ionicons/icons";
import '../theme/Search.css';
import {useCallback, useState} from "react";
import {localOrdersService, restaurantService} from "../Service";
import {GeoLocation, PageResult, Product, Restaurant, RestaurantSearchField} from "../Types";
import {usePagedList} from "../usePagedList";
import {pop, skewIn} from "../animations";
import {OrderedItem} from "../components/OrderItems";
import MapModal from "../components/MapModal";

const PAGE_SIZE = 5;
// "location" nu e camp de cautare pe backend (/search), are endpoint-ul lui (/nearby)
type SearchMode = RestaurantSearchField | "location";
const proto = location.protocol === "https:" ? "wss" : "ws";
const Search: React.FC = () => {
    const [searchBy, setSearchBy] = useState<SearchMode>("name");
    // textul cautat; in modul "location" e raza in km
    const [query, setQuery] = useState("");
    // punctul ales pe harta pentru cautarea dupa locatie
    const [point, setPoint] = useState<GeoLocation | null>(null);
    const [pickingPoint, setPickingPoint] = useState(false);
    // restaurantul aratat acum pe harta; null = harta inchisa
    const [onMap, setOnMap] = useState<Restaurant | null>(null);
    const [submitted, setSubmitted] = useState<{by: SearchMode, value: string, point: GeoLocation | null} | null>(null);
    const fetchPage = useCallback((page: number): Promise<PageResult<Restaurant>> => {
        const nothing = Promise.resolve({items: [], page, last: true});
        if(!submitted)return nothing;
        if (submitted.by === "location") {
            const radius = Number(submitted.value);
            if (!submitted.point || !(radius > 0)) return nothing;
            return restaurantService.nearby(submitted.point, radius, page, PAGE_SIZE);
        }
        if (submitted.by === "id" && !/^\d+$/.test(submitted.value)) {
            return nothing;
        }
        return restaurantService.search(submitted.by, submitted.value, page, PAGE_SIZE);
    }, [submitted]);
    // cheia include si punctul: aceeasi raza in alt loc e alta cautare
    const fetchedData = usePagedList(fetchPage, submitted
        ? `${submitted.by}:${submitted.value}:${submitted.point?.latitude},${submitted.point?.longitude}` : "");
    //const {items: restaurants, last, loadMore} = usePagedList(fetchPage, `${searchBy}:${query}`);
    /*
    useEffect(() => {
        const client = new Client({brokerURL: "ws://localhost:8080/mywebsockets/websocket"});
        client.onConnect = () => {
            client.subscribe("/products", (msg) => {
                const body = JSON.parse(msg.body);
                const prod: Product = body.innerDto;
                const operation: string = body.operation;
                setProducts((prev) => {
                    switch (operation) {
                        case "ADDITION":
                            return [...prev, prod];
                        case "DELETION":
                            return prev.filter((p: Product) => p.id !== prod.id);
                        default:
                            return prev;
                    }
                });
            });
        };
        client.activate();
        return () => client.deactivate();
    }, [order, setOrder]);
    */
    const addToOrder = (p: Product) => {
        const orderItem = {...p,quantity:1} as OrderedItem
        //alert(JSON.stringify(orderItem, null, 2))
        localOrdersService.addItem(orderItem);
    }
    return (
        <IonPage className={"searchPage"}>
            <IonHeader>
                <IonToolbar id={"mainToolbar"}>
                    <IonTitle>Search</IonTitle>
                    <IonSelect slot="start"
                               interface="popover"
                               value={searchBy}
                               onIonChange={(event) => setSearchBy(event.detail.value)}>
                        <IonSelectOption value="name">Nume</IonSelectOption>
                        <IonSelectOption value="id">Id</IonSelectOption>
                        <IonSelectOption value="location">Locație</IonSelectOption>
                    </IonSelect>
                    {searchBy === "location" ? <>
                        <IonInput className={"radiusInput"} type="number" inputmode="decimal" min="0"
                                  placeholder="Raza (km)" value={query}
                                  onIonInput={(event) => setQuery(event.detail.value ?? "")}/>
                        <IonButton fill="outline" onClick={() => setPickingPoint(true)}>
                            <IonIcon slot="start" icon={locationOutline}/>
                            {point ? `${point.latitude.toFixed(4)}, ${point.longitude.toFixed(4)}` : "Alege punctul"}
                        </IonButton>
                    </> :
                    <IonSearchbar animated={true}
                                  onIonFocus={(event) => void skewIn(event.target)}
                                  placeholder={searchBy === "id" ? "Id-ul restaurantului" : "Numele restaurantului"}
                                  inputmode={searchBy === "id" ? "numeric" : "text"}
                                  debounce={400}
                                  searchIcon={searchCircle}
                                  showClearButton="focus"
                                  clearIcon={trashSharp}
                                  color="light"
                                  id={"searchBar"}
                                  value={query}
                                  onIonInput={(event) => setQuery(event.detail.value ?? "")}
                    >
                    </IonSearchbar>}
                    <IonButton slot={"end"}
                               style={{height:"100%"}}
                               onClick={() => setSubmitted({by: searchBy, value: query.trim(), point})}>
                        Search
                    </IonButton>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                {fetchedData.items.length === 0 &&
                    <IonCard>
                        <IonCardHeader>
                            <IonCardSubtitle>Niciun restaurant găsit</IonCardSubtitle>
                        </IonCardHeader>
                    </IonCard>}
                {fetchedData.items.map(r => (
                    <IonCard key={r.id}>
                        {r.image && <img alt={r.name} src={r.image} className={"restaurantImage"}/>}
                        <IonCardHeader>
                            {r.location &&
                                <IonButton className={"mapButton"} fill="clear" onClick={() => setOnMap(r)}>
                                    <IonIcon slot="start" icon={locationOutline}/>
                                    Hartă
                                </IonButton>}
                            <IonCardTitle>{r.name}</IonCardTitle>
                            <IonCardSubtitle>
                                {r.adress}{r.distanceKm !== undefined && ` · ${r.distanceKm} km`}
                            </IonCardSubtitle>
                        </IonCardHeader>
                        <IonList>
                            {r.products.map(p => (
                                <IonItem key={p.id}>
                                    {p.image &&
                                        <IonThumbnail slot="start">
                                            <img alt={p.name} src={p.image} style={{borderRadius:"10px"}}/>
                                        </IonThumbnail>}
                                    <IonLabel>{p.name}</IonLabel>
                                    <IonNote slot="end">{p.price} lei</IonNote>
                                    <IonButton slot="end" fill="outline" color="warning"
                                               onClick={(e) => {
                                                   void pop(e.currentTarget);
                                                   addToOrder(p);
                                               }}>+</IonButton>
                                </IonItem>
                            ))}
                        </IonList>
                    </IonCard>
                ))}
                <IonInfiniteScroll disabled={fetchedData.last}
                                   onIonInfinite={async (event) => {
                                       await fetchedData.loadMore();
                                       await event.target.complete();
                                   }}>
                    <IonInfiniteScrollContent loadingText="Se încarcă mai multe restaurante..."/>
                </IonInfiniteScroll>
                <MapModal isOpen={pickingPoint} title={"Atinge harta unde cauți"} location={point}
                          onClose={() => setPickingPoint(false)} onConfirm={setPoint}/>
                <MapModal isOpen={onMap !== null} title={onMap?.name ?? ""}
                          location={onMap?.location} onClose={() => setOnMap(null)}/>
            </IonContent>
        </IonPage>
    );
};
export default Search;