import {Navigate, Route} from 'react-router-dom';
import {IonApp, IonRouterOutlet, setupIonicReact} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';
import Home from './pages/Home';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */
/* import '@ionic/react/css/palettes/dark.always.css'; */
/* import '@ionic/react/css/palettes/dark.class.css'; */
//import '@ionic/react/css/palettes/dark.system.css';
/* Theme variables */
//import './theme/variables.css';
import Search from "./pages/Search";
import OrderItems, {OrderedItem} from "./components/OrderItems";
import {useState} from "react";

setupIonicReact();
export interface OrderProps {
    order: OrderedItem[];
    setOrder: React.Dispatch<React.SetStateAction<OrderedItem[]>>;
}
const App: React.FC = () => {
    const [order,setOrder] = useState<OrderedItem[]>([]);
    return <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <Route path="/search" element={<Search order={order} setOrder={setOrder}/>}/>
                <Route path="/order" element={<OrderItems order={order} setOrder={setOrder}/>}/>
                <Route path="/home" element={<Home/>}/>
                <Route path="/" element={<Navigate to="/home" replace/>}/>
            </IonRouterOutlet>
        </IonReactRouter>
    </IonApp>
};

export default App;
