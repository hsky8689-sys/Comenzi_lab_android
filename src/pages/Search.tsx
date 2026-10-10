import {
    IonButton,
    IonCard,
    IonCardHeader,
    IonCardSubtitle,
    IonCardTitle,
    IonContent,
    IonHeader,
    IonItem,
    IonLabel,
    IonList,
    IonNote,
    IonPage,
    IonSearchbar,
    IonTitle,
    IonToolbar
} from "@ionic/react";
import {searchCircle, trashSharp} from "ionicons/icons";
import log from "../logger";
import './Search.css';
import {RefObject, useEffect, useRef, useState} from "react";
import {restaurantService} from "../Service";
import {Product, Restaurant} from "../Types";
import {Client} from "@stomp/stompjs";
import {OrderProps} from "../App";

const Search: React.FC<OrderProps> = ({order,setOrder}) => {
    const defaultLook: Restaurant = {
        id: 0,
        name: "Search for any restaurants",
        adress: "Display avalilible products",
        products: []
    };
    const [results, setResults] = useState<Restaurant>(defaultLook);
    const [products, setProducts] = useState<Product[]>([]);
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
    const handleInput = async (event: Event) => {
        let query = 0;
        const target = event.target as HTMLIonSearchbarElement;
        if (target) query = parseInt(target.value!.toLowerCase());
        const found = await restaurantService.searchById(query);
        log.debug(found);
        if (found.id !== 0) {
            setResults(found);
            setProducts(found.products);
        }
    }
    const addToOrder = (p: Product) => {
        const found = order.find(pr=>pr.id===p.id)?.quantity
        const quantity = found !== undefined ? found : 0;
        setOrder([...order, {...p,quantity:quantity+1}]);
    }
    return (
        <IonPage className={"searchPage"}>
            <IonHeader>
                <IonToolbar id={"mainToolbar"}>
                    <IonTitle>Search</IonTitle>
                    <IonSearchbar animated={true}
                                  placeholder="Type to search something"
                                  searchIcon={searchCircle}
                                  showClearButton="focus"
                                  clearIcon={trashSharp}
                                  color="light"
                                  id={"searchBar"}
                                  onIonInput={(event) => handleInput(event)}
                    >
                    </IonSearchbar>
                </IonToolbar>
            </IonHeader>
            <IonContent>
                <IonCard>
                    <IonCardHeader>
                        <IonCardTitle>{results.name}</IonCardTitle>
                        <IonCardSubtitle>{results.adress}</IonCardSubtitle>
                    </IonCardHeader>
                    {
                        <IonList>
                            {products.map(p => (
                                <IonItem key={p.id}>
                                    <IonLabel>{p.name}</IonLabel>
                                    <IonNote slot="end">{p.price} lei</IonNote>
                                    <IonButton slot="end" fill="outline" color="warning"
                                               onClick={() => addToOrder(p)}>+</IonButton>
                                </IonItem>
                            ))}
                        </IonList>
                    }
                    <IonButton onClick={() => {

                    }
                    }>View my order</IonButton>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};
export default Search;