import React, {useState} from "react";
import {IonButton, IonButtons, IonContent, IonHeader, IonModal, IonTitle, IonToolbar} from "@ionic/react";
import {MapContainer, Marker, TileLayer, useMapEvents} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Leaflet isi cauta iconitele markerului dupa o cale relativa care nu mai exista dupa ce Vite
// impacheteaza aplicatia, deci le importam noi si construim iconita de mana
import iconUrl from "leaflet/dist/images/marker-icon.png";
import iconRetinaUrl from "leaflet/dist/images/marker-icon-2x.png";
import shadowUrl from "leaflet/dist/images/marker-shadow.png";
import {GeoLocation} from "../Types";

const markerIcon = L.icon({iconUrl, iconRetinaUrl, shadowUrl, iconSize: [25, 41], iconAnchor: [12, 41]});
const CLUJ: [number, number] = [46.7712, 23.6236];

// asculta click-urile pe harta; trebuie sa fie copil al lui MapContainer ca sa aiba acces la harta
const ClickToPick: React.FC<{ onPick: (location: GeoLocation) => void }> = ({onPick}) => {
    useMapEvents({
        click: e => onPick({latitude: e.latlng.lat, longitude: e.latlng.lng}),
    });
    return null;
};

interface Props {
    isOpen: boolean;
    title: string;
    location?: GeoLocation | null;            // markerul de la deschidere
    onClose: () => void;
    onConfirm?: (location: GeoLocation) => void; // daca e dat, harta e in modul "alege o locatie"
}

const MapModal: React.FC<Props> = ({isOpen, title, location, onClose, onConfirm}) => {
    const picking = onConfirm !== undefined;
    const [chosen, setChosen] = useState<GeoLocation | null>(location ?? null);
    // Leaflet isi masoara containerul cand se creeaza harta; daca o cream cat modalul inca se animeaza,
    // are dimensiunea gresita si apar tile-uri gri. O cream abia dupa ce modalul e complet deschis.
    const [ready, setReady] = useState(false);
    const center: [number, number] = chosen ? [chosen.latitude, chosen.longitude] : CLUJ;
    return <IonModal isOpen={isOpen}
                     onWillPresent={() => setChosen(location ?? null)}
                     onDidPresent={() => setReady(true)}
                     onDidDismiss={() => { setReady(false); onClose(); }}>
        <IonHeader>
            <IonToolbar>
                <IonTitle>{title}</IonTitle>
                <IonButtons slot="end">
                    {picking &&
                        <IonButton strong disabled={!chosen} onClick={() => { if (chosen) onConfirm(chosen); onClose(); }}>
                            Confirmă
                        </IonButton>}
                    <IonButton onClick={onClose}>Închide</IonButton>
                </IonButtons>
            </IonToolbar>
        </IonHeader>
        <IonContent scrollY={false}>
            {ready &&
                <MapContainer center={center} zoom={chosen ? 16 : 13} style={{height: "100%", width: "100%"}}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                    {chosen && <Marker position={[chosen.latitude, chosen.longitude]} icon={markerIcon}/>}
                    {picking && <ClickToPick onPick={setChosen}/>}
                </MapContainer>}
        </IonContent>
    </IonModal>;
};

export default MapModal;
