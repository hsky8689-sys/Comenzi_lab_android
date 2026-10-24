import React, {useEffect, useState} from "react";
import {
    IonButton,
    IonCard,
    IonContent,
    IonHeader,
    IonInput,
    IonInputPasswordToggle,
    IonLabel,
    IonPage
} from "@ionic/react";
import {authService, useLoginState} from "../Service";
import {useNavigate} from 'react-router';
import '../theme/Login.css'

const LoginPage:React.FC = () => {
    const navigate = useNavigate();
    const isLogged = useLoginState();
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [errorMessage,setErrorMessage] = useState("");
    useEffect(() => {
        if(isLogged) {
            navigate("/search");
        }
    }, [isLogged, navigate]);
    const handleLogin = async () => {
        await authService.login(username,password);
        if(!isLogged){
            setErrorMessage("Bad credentials");
        }
    };
    return <IonPage className={'login-page'}>
                <IonHeader>
                    <IonCard>
                        <div>Welcome to Wolt de buget</div>
                    </IonCard>
                </IonHeader>
                <IonContent>
                    <IonCard className={'credentials-wrapper'}>
                        <IonCard className={'login-credentials'}>
                            <IonInput placeholder={"Enter your username"} value={username} maxlength={30} onChange={(e)=>setUsername(e.target.value)}></IonInput>
                            <br/>
                            <IonInput placeholder={"Enter your password"} value={password} maxlength={30} onChange={(e)=>setPassword(e.target.value)}>
                                <IonInputPasswordToggle slot="end"/>
                            </IonInput>
                                <IonButton onClick={()=>handleLogin()}>Login</IonButton>
                            {errorMessage!=="" &&
                            <IonLabel>
                                <p>Bad credentials requested</p>
                            </IonLabel>}
                        </IonCard>
                    </IonCard>
                    <IonCard className={'ion-justify-content-center'}>
                        <div className={'footer'}>
                            New to our app?<IonButton onClick={()=>navigate('/signup')}>Sign up</IonButton>here
                        </div>
                    </IonCard>
                </IonContent>
           </IonPage>
}
export default LoginPage;