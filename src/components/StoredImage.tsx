import React, {useEffect, useState} from "react";
import {photoStorage} from "../photoStorage";

interface Props {
    photoKey: string;      // cheia copiei de pe device, ex "product-12"
    src?: string;          // url-ul de pe server
    alt: string;
    className?: string;
}

// poza de pe server, iar daca serverul nu raspunde (offline) sau n-are poza, copia salvata pe device
const StoredImage: React.FC<Props> = ({photoKey, src, alt, className}) => {
    const [local, setLocal] = useState<string | null>(null);
    const [remoteFailed, setRemoteFailed] = useState(false);
    const useLocal = !src || remoteFailed;
    useEffect(() => {
        if (!useLocal) return;
        let active = true; // daca intre timp componenta s-a schimbat, ignoram rezultatul vechi
        void photoStorage.load(photoKey).then(found => { if (active) setLocal(found); });
        return () => { active = false; };
    }, [photoKey, useLocal]);
    const shown = useLocal ? local : src;
    if (!shown) return null;
    return <img alt={alt} src={shown} className={className} onError={() => setRemoteFailed(true)}/>;
};

export default StoredImage;
