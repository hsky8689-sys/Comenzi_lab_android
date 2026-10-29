import React, {useEffect, useState} from "react";
import {
    IonButton,
    IonCard,
    IonContent,
    IonHeader,
    IonInput,
    IonInputPasswordToggle,
    IonLabel,
    IonPage,
    IonToggle
} from "@ionic/react";
import {authService, localStorageService, useLoginState} from "../Service";
import {useNavigate} from 'react-router';
import '../theme/Login.css'

const LoginPage:React.FC = () => {
    const navigate = useNavigate();
    const isLogged = useLoginState();
    const [isLoginMode,setLoginMode]=useState(true);
    const [username,setUsername]=useState("");
    const [password,setPassword]=useState("");
    const [email,setEmail]=useState("");
    const [errorMessage,setErrorMessage] = useState("");
    const [busy,setBusy] = useState(false);
    useEffect(() => {
        if(isLogged) {
            navigate("/search");
        }
    }, [isLogged, navigate]);
    const switchMode = (loginMode:boolean) => {
        setLoginMode(loginMode);
        setErrorMessage("");
    };
    const handleLogin = async () => {
        await authService.login(username,password);
        if(!localStorageService.isUserLogged()){
            setErrorMessage("Bad credentials");
        }
    };
    const handleSignup = async () => {
        if(username.trim()==="" || password==="" || email.trim()===""){
            setErrorMessage("Completează username, parola și emailul");
            return;
        }
        const error = await authService.signUp(username.trim(),password,email.trim());
        if(error){
            setErrorMessage(error);
            return;
        }
        await handleLogin();
    };
    const submit = async () => {
        setBusy(true);
        setErrorMessage("");
        try {
            await (isLoginMode ? handleLogin() : handleSignup());
        } finally {
            setBusy(false);
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
                            <IonToggle checked={isLoginMode}
                                       onIonChange={(e)=>switchMode(e.detail.checked)}>
                                {isLoginMode ? "Login" : "Sign up"}
                            </IonToggle>
                            <br/>
                            <IonInput placeholder={"Enter your username"} value={username} maxlength={30}
                                      onIonInput={(e)=>setUsername(e.detail.value ?? "")}></IonInput>
                            <br/>
                            {!isLoginMode && <>
                                <IonInput placeholder={"Enter your email"} type={"email"} value={email} maxlength={60}
                                          onIonInput={(e)=>setEmail(e.detail.value ?? "")}></IonInput>
                                <br/>
                            </>}
                            <IonInput placeholder={"Enter your password"} type={"password"} value={password} maxlength={30}
                                      onIonInput={(e)=>setPassword(e.detail.value ?? "")}>
                                <IonInputPasswordToggle slot="end"/>
                            </IonInput>
                            <IonButton disabled={busy} onClick={()=>submit()}>
                                {isLoginMode ? "Login" : "Sign up"}
                            </IonButton>
                            {errorMessage!=="" &&
                            <IonLabel color={"danger"}>
                                <p>{errorMessage}</p>
                            </IonLabel>}
                        </IonCard>
                    </IonCard>
                </IonContent>
           </IonPage>
}
export default LoginPage;
