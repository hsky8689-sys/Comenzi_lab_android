import React from "react";
import {IonButton} from "@ionic/react";
import {useNavigate} from "react-router";
import {useLoginState} from "../Service";

const Navbar  =() => {
    const navigate = useNavigate();
    const isLogged = useLoginState();
    return <div style={{display:isLogged?'flex':'none',flexDirection:'row',position:"fixed",bottom:"10px"}}>
        <IonButton onClick={()=>navigate('/search')}>Search page</IonButton>
        <IonButton onClick={()=>navigate('/restaurants')}>Manage restaurants</IonButton>
        <IonButton onClick={()=>navigate('/orders')}>My orders</IonButton>
    </div>
}
export default Navbar;