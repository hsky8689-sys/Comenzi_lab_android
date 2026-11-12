import React from "react";
import {IonButton, IonIcon} from "@ionic/react";
import {Camera, CameraResultType, CameraSource} from "@capacitor/camera";
import {alert, cameraOutline, closeCircleOutline, imagesOutline} from "ionicons/icons";

export interface PickedPhoto {
    webPath: string;
}

export const photoToBlob = async (photo: PickedPhoto): Promise<Blob> =>
    (await fetch(photo.webPath)).blob();

interface Props {
    current?: string;
    picked: PickedPhoto | null;
    onPicked: (photo: PickedPhoto | null) => void;
}

const PhotoPicker: React.FC<Props> = ({current, picked, onPicked}) => {
    // Camera = deschide camera, Photos = alege din galerie / fisiere
    const pick = async (source: CameraSource) => {
        try {
            const photo = await Camera.getPhoto({
                source,
                resultType: CameraResultType.Uri,
                quality: 70,
                width: 1024,
            });
            if (photo.webPath) onPicked({webPath: photo.webPath});
        } catch {

        }
    };
    const preview = picked?.webPath ?? current;
    return <div className={"photoPicker"}>
        {preview && <img alt={"preview"} src={preview}/>}
        <IonButton fill="outline" onClick={() => pick(CameraSource.Camera)}>
            <IonIcon slot="icon-only" icon={cameraOutline}/>
        </IonButton>
        <IonButton fill="outline" onClick={() => pick(CameraSource.Photos)}>
            <IonIcon slot="icon-only" icon={imagesOutline}/>
        </IonButton>
        {picked &&
            <IonButton fill="clear" color="medium" onClick={() => onPicked(null)}>
                <IonIcon slot="icon-only" icon={closeCircleOutline}/>
            </IonButton>}
    </div>;
};

export default PhotoPicker;
