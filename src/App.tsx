import {Navigate, Route} from 'react-router-dom';
import {IonApp, IonButton, IonCard, IonChip, IonIcon, IonLabel, IonRouterOutlet, setupIonicReact} from '@ionic/react';
import {IonReactRouter} from '@ionic/react-router';
import './App.css'

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
import {useNetworkStatus} from "./Network";
import {ellipse, logOutOutline} from "ionicons/icons";
import LoginPage from "./pages/Login";
import {useNavigate} from "react-router";
import {authService} from "./Service";

setupIonicReact();
export interface OrderProps {
    order: OrderedItem[];
    setOrder: React.Dispatch<React.SetStateAction<OrderedItem[]>>;
}
// has to live inside IonReactRouter, useNavigate only works there
const LogoutButton: React.FC = () => {
    const navigate = useNavigate();
    const logout = () => {
        authService.logout();
        navigate("/login", {replace: true});
    };
    return <IonButton size="small" color="medium" onClick={logout}>
        <IonIcon slot="start" icon={logOutOutline}/>
        Logout
    </IonButton>
};
const App: React.FC = () => {
    const isOnline =useNetworkStatus();
    return <IonApp>
        <IonReactRouter>
            <IonRouterOutlet>
                <Route path="/search" element={<Search/>}/>
                <Route path="/order" element={<OrderItems/>}/>
                <Route path="/login" element={<LoginPage/>}/>
                <Route path="/" element={<Navigate to="/login" replace/>}/>
            </IonRouterOutlet>
            <IonCard className={'card-colt'}>
                <div className={'content'}>
                    <LogoutButton/>
                    You are currently {
                    <IonChip color={isOnline ? 'success' : 'danger'}>
                        <IonIcon icon={ellipse} />
                        <IonLabel>{isOnline ? 'Online' : 'Offline'}</IonLabel>
                    </IonChip>}
                </div>
            </IonCard>
        </IonReactRouter>
    </IonApp>
};

export default App;
