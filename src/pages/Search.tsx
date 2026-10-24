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
import '../theme/Search.css';
import {useState} from "react";
import {localOrdersService, restaurantService} from "../Service";
import {Product, Restaurant} from "../Types";
import {useNavigate} from 'react-router';
import {OrderedItem} from "../components/OrderItems";

const Search: React.FC = () => {
    const defaultLook: Restaurant = {
        id: 0,
        name: "Search for any restaurants",
        adress: "Display avalilible products",
        products: []
    };
    const [results, setResults] = useState<Restaurant>(defaultLook);
    const [products, setProducts] = useState<Product[]>([]);
    const navigate = useNavigate();
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
    const handleInput = async (event: Event) => {
        let query = 0;
        const target = event.target as HTMLIonSearchbarElement;
        if (target) query = parseInt(target.value!.trim().toLowerCase());
        const found = await restaurantService.searchById(query);
        log.debug(found);
        if (found.id > 0) {
            setResults(found);
            setProducts(found.products);
        }
    }
    const addToOrder = (p: Product) => {
        const orderItem = {id:p.id,name:p.name,price:p.price,restaurant:p.restaurant,quantity:1} as OrderedItem
        //alert(JSON.stringify(orderItem, null, 2))
        localOrdersService.addItem(orderItem);
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
                        navigate('/order');
                    }
                    }>View my order</IonButton>
                </IonCard>
            </IonContent>
        </IonPage>
    );
};
export default Search;