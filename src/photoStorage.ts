import {Directory, Filesystem} from "@capacitor/filesystem";
import log from "./logger";

// copia locala a pozelor: pe telefon e un fisier real in folderul privat al aplicatiei (Directory.Data),
// in browser Capacitor o tine in IndexedDB. Cheia e de forma "restaurant-3" / "product-12".
const pathFor = (key: string) => `photos/${key}.jpeg`;

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    // rezultatul e "data:image/jpeg;base64,AAAA..."; Filesystem vrea doar partea de dupa virgula
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.readAsDataURL(blob);
});

export const photoStorage = {
    async save(key: string, photo: Blob): Promise<void> {
        try {
            await Filesystem.writeFile({
                path: pathFor(key),
                data: await blobToBase64(photo),
                directory: Directory.Data,
                recursive: true, // creeaza si folderul photos/ daca nu exista
            });
        } catch (err) {
            log.error(`nu am putut salva poza ${key} pe device:`, err);
        }
    },
    // data url gata de pus in <img src>, sau null daca nu avem poza salvata
    async load(key: string): Promise<string | null> {
        try {
            const file = await Filesystem.readFile({path: pathFor(key), directory: Directory.Data});
            const base64 = typeof file.data === "string" ? file.data : await blobToBase64(file.data);
            return `data:image/jpeg;base64,${base64}`;
        } catch {
            return null; // fisierul nu exista
        }
    },
    async remove(key: string): Promise<void> {
        try {
            await Filesystem.deleteFile({path: pathFor(key), directory: Directory.Data});
        } catch {
            // nu era salvata, nimic de sters
        }
    },
};
