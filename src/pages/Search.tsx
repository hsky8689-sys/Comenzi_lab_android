import {
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
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
    IonTitle,
    IonToolbar
} from "@ionic/react";
import {searchCircle, trashSharp} from "ionicons/icons";
import '../theme/Search.css';
import {useCallback, useState} from "react";
import {localOrdersService, restaurantService} from "../Service";
import {PageResult, Product, Restaurant, RestaurantSearchField} from "../Types";
import {usePagedList} from "../usePagedList";
import {useNavigate} from 'react-router';
import {OrderedItem} from "../components/OrderItems";

const PAGE_SIZE = 5;
const Search: React.FC = () => {
    const [searchBy, setSearchBy] = useState<RestaurantSearchField>("name");
    const [query, setQuery] = useState("");
    const navigate = useNavigate();
    const fetchPage = useCallback((page: number): Promise<PageResult<Restaurant>> => {
        const value = query.trim();
        // an id search needs a number; anything else would only get a 400 from the backend
        if (searchBy === "id" && !/^\d+$/.test(value)) {
            return Promise.resolve({items: [], page, last: true});
        }
        return restaurantService.search(searchBy, value, page, PAGE_SIZE);
    }, [searchBy, query]);
    const {items: restaurants, last, loadMore} = usePagedList(fetchPage, `${searchBy}:${query}`);
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
                    </IonSelect>
                    <IonSearchbar animated={true}
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
                    </IonSearchbar>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonButton onClick={() => navigate('/order')}>View my order</IonButton>
                {restaurants.length === 0 &&
                    <IonCard>
                        <IonCardHeader>
                            <IonCardSubtitle>Niciun restaurant găsit</IonCardSubtitle>
                        </IonCardHeader>
                    </IonCard>}
                {restaurants.map(r => (
                    <IonCard key={r.id}>
                        <IonCardHeader>
                            <IonCardTitle>{r.name}</IonCardTitle>
                            <IonCardSubtitle>{r.adress}</IonCardSubtitle>
                        </IonCardHeader>
                        <IonList>
                            {r.products.map(p => (
                                <IonItem key={p.id}>
                                    <IonLabel>{p.name}</IonLabel>
                                    <IonNote slot="end">{p.price} lei</IonNote>
                                    <IonButton slot="end" fill="outline" color="warning"
                                               onClick={() => addToOrder(p)}>+</IonButton>
                                </IonItem>
                            ))}
                        </IonList>
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
    );
};
export default Search;