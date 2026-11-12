import {createAnimation} from "@ionic/react";

// animatii scurte cu Ionic Animations (createAnimation): ruleaza pe Web Animations API,
// deci nu blocheaza thread-ul si nu trebuie clase CSS adaugate/scoase de mana.
// Fiecare functie intoarce promise-ul lui play(), ca sa putem astepta sa se termine.

// searchbar-ul se "inclina" scurt cand primeste focus
export const skewIn = (el: Element) => createAnimation()
    .addElement(el)
    .duration(450)
    .easing("ease-out")
    .keyframes([
        {offset: 0, transform: "skewX(0deg)"},
        {offset: 0.3, transform: "skewX(-12deg)"},
        {offset: 0.65, transform: "skewX(5deg)"},
        {offset: 1, transform: "skewX(0deg)"},
    ])
    .play();

// butonul de + "sare" cand adaugi ceva in comanda
export const pop = (el: Element) => createAnimation()
    .addElement(el)
    .duration(300)
    .easing("cubic-bezier(.34,1.56,.64,1)") // depaseste putin tinta si revine, ca un arc
    .keyframes([
        {offset: 0, transform: "scale(1)"},
        {offset: 0.4, transform: "scale(1.35)"},
        {offset: 0.7, transform: "scale(0.9)"},
        {offset: 1, transform: "scale(1)"},
    ])
    .play();

// cosul de gunoi tremura inainte de confirmarea stergerii
export const shake = (el: Element) => createAnimation()
    .addElement(el)
    .duration(400)
    .easing("ease-in-out")
    .keyframes([
        {offset: 0, transform: "translateX(0) rotate(0)"},
        {offset: 0.2, transform: "translateX(-5px) rotate(-12deg)"},
        {offset: 0.4, transform: "translateX(5px) rotate(12deg)"},
        {offset: 0.6, transform: "translateX(-4px) rotate(-8deg)"},
        {offset: 0.8, transform: "translateX(3px) rotate(6deg)"},
        {offset: 1, transform: "translateX(0) rotate(0)"},
    ])
    .play();

// ---- override pentru animatiile unei componente Ionic ----
// Overlay-urile Ionic (alert, modal, popover, toast...) primesc enterAnimation / leaveAnimation:
// o functie (baseEl) => Animation. Ionic o cheama in locul animatiei lui implicite cand se deschide / inchide.
// baseEl e elementul <ion-alert>; in el sunt fundalul intunecat (ion-backdrop) si cutia alertei (.alert-wrapper),
// aceleasi elemente pe care le animeaza si Ionic in animatia lui implicita.
export const alertEnter = (baseEl: HTMLElement) => {
    const backdrop = createAnimation()
        .addElement(baseEl.querySelector("ion-backdrop")!)
        .fromTo("opacity", "0.01", "var(--backdrop-opacity)");
    // cutia cade de sus, se rasuceste putin si se aseaza cu un mic recul
    const wrapper = createAnimation()
        .addElement(baseEl.querySelector(".alert-wrapper")!)
        .keyframes([
            {offset: 0, opacity: "0", transform: "translateY(-120px) rotate(-8deg) scale(0.8)"},
            {offset: 0.6, opacity: "1", transform: "translateY(12px) rotate(3deg) scale(1.03)"},
            {offset: 1, opacity: "1", transform: "translateY(0) rotate(0) scale(1)"},
        ]);
    // animatia parinte da durata si easing pentru amandoua copiii, care ruleaza in acelasi timp
    return createAnimation()
        .addElement(baseEl)
        .easing("ease-out")
        .duration(450)
        .addAnimation([backdrop, wrapper]);
};

// la inchidere rulam aceeasi animatie invers, mai repede
export const alertLeave = (baseEl: HTMLElement) =>
    alertEnter(baseEl).direction("reverse").duration(250);
