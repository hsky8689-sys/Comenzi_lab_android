import {Directory, Filesystem} from "@capacitor/filesystem";
import log from "./logger";

const pathFor = (key: string) => `photos/${key}.jpeg`;

const blobToBase64 = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
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
                recursive: true,
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
