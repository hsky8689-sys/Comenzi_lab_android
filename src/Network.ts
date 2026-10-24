import {useSyncExternalStore} from "react";

let online = navigator.onLine;
const listeners = new Set<()=>void>();

const update = (value:boolean)=>{
  online = value;
  listeners.forEach(l=>l());
};
const checkInternet = async () => {
    try {
        await fetch('https://www.gstatic.com/generate_204', {
            mode: 'no-cors',
            cache: 'no-store',
        });
        if(!online)update(true);
    } catch {
        if(online)update(false);
    }
};
window.addEventListener('online',()=>checkInternet());
window.addEventListener('offline',()=>update(false));
export const network = {
  isOnline: ()=>online,
  subscribe(listener:()=>void){
      listeners.add(listener);
      return () => listeners.delete(listener);
  }
};
export const useNetworkStatus = () =>
    useSyncExternalStore(network.subscribe, network.isOnline);
setInterval(checkInternet,5000);