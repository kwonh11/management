 import { BrowserRouter, Switch, Route } from "react-router-dom";
import Nav from "./nav/Nav";
import Guestbook from "./guestbook/Guestbook";
import Management from "./management/Management";
import Headers from './management/Headers';
import {CssBaseline} from '@material-ui/core';
import Home from "./home/Home";
import Footer from '../src/footer/Footer';
import qs from 'qs';
import {useCookies} from 'react-cookie';
import { getTokenAndProfile } from "./util/LoginAPI";
import CustomSnackbar from './customHook/SnackBar';
import ErrorFallback from './customHook/ErrorFallback';
import { ErrorBoundary } from "react-error-boundary";

// 컨텍스트 목록
export const UserContext = React.createContext();
export const LogoutContext = React.createContext();
export const ProgressContext = React.createContext();
export const GlobalSnackbarContext = React.createContext();

export default function App() {
    const { id_token } = qs.parse(window.location.hash.substr(1));
    const [ cookies , setCookie , removeCookie ] = useCookies (['profile']);
    const [ profile , setProfile ] = React.useState(cookies.profile);
    const [isLoading, setIsLoading] = React.useState(false);
    // snackbar
    const [globalSnackbar, setGlobalSnackbar] = React.useState({open : false , result: 'success'});
    const [tooFastSnack, setTooFastSnack] = React.useState({open:false});
    const [deletedSnack, setDeletedSnack] = React.useState({open:false});
    const [errorSnack, setErrorSnack] = React.useState({open:false,content:''});
    const [successSnack, setSuccessSnack] = React.useState({open:false});
    const [notLoggedSnack, setNotLoggedSnack] = React.useState({open:false});

    const guestBookSnackProps = {isLoading ,
        tooFastSnack, setTooFastSnack,
        deletedSnack, setDeletedSnack,
        errorSnack, setErrorSnack,
        successSnack, setSuccessSnack,
        notLoggedSnack, setNotLoggedSnack}

    const progressRef = React.useRef(0);
    const handleBeforeunload = (result) => {
        const interval = setInterval(()=> {
            console.log(`progress : ${progressRef.current}`);
            setIsLoading(true);
            progressRef.current = (progressRef.current < 100 ? progressRef.current + 20 : 100);
        if (progressRef.current === 100) {
             progressRef.current = 0;
             setIsLoading(false);
             clearInterval(interval);
        }
    },200)
    }
    React.useEffect(()=>{
        if(id_token) {
            console.log('fetch API 실행');
            getTokenAndProfile(id_token).then(data => {
                console.log(`response data : ${JSON.stringify(data)}`);
                const {name ,email, picture} = data;
                setCookie("profile",{name , email, picture},{path:"/" , maxAge : 7200, sameSite:'none'});  // maxAge : 2시간
            }).catch(err => {
                throw new Error('Login Failed. Please authorize the use of cookies in your browser.');
            })
        }
    },[id_token]);

    React.useEffect(()=>{
        if (cookies.profile) {
            console.log(`cookies.profile : ${JSON.stringify(cookies.profile)}`);
            setProfile(cookies.profile);
        }
    },[cookies.profile]);
    
    return (
        <React.Fragment>
            <ErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={(error, componentStack)=>{
                console.log(`error : ${error}
                componentStack : ${componentStack}`);
            }}
            onReset={()=>location.replace(location.origin)}
            >
            <UserContext.Provider value={profile || {name : ''}}>          {/* 유저 프로필 컨텍스트    */}
            <LogoutContext.Provider value={setProfile}>   {/* 로그아웃 이벤트 컨텍스트   */}
            <ProgressContext.Provider value={(result)=>handleBeforeunload(result)}>  {/* 로딩 컨텍스트   */}
            <GlobalSnackbarContext.Provider value={setGlobalSnackbar}>  {/* 에러 스낵바 컨텍스트   */}
                <CssBaseline/>
                    <BrowserRouter>
                    <Nav/>
                    <Switch>
                        <Route exact path='/' render={()=><Home isLoading={isLoading}/>}></Route>
                        <Route path='/guestbook' render={()=><Guestbook {...guestBookSnackProps}/>}></Route>
                        <Route path='/management' render={()=> <Management 
                        setErrorSnack={setErrorSnack}
                        isLoading={isLoading}/>}></Route>
                        <Route path='/headers' render={()=> <Headers isLoading={isLoading}/>}></Route>
                    </Switch>
                        <Route path='/' render={(props)=><Footer {...props}/>}></Route>
                    </BrowserRouter>
            </GlobalSnackbarContext.Provider>
            </ProgressContext.Provider>
            </LogoutContext.Provider>
            </UserContext.Provider>
                <CustomSnackbar open={globalSnackbar.open} onClose={()=>setGlobalSnackbar({open:false})} 
                content={globalSnackbar.result==='error'? `Not saved.
                Reason : Invalid input.` :' SAVED '} status={globalSnackbar.result}
                direction={{vertical:'top', horizontal:'right'}}/>
                <CustomSnackbar open={successSnack.open} onClose={()=>setSuccessSnack({open:false})}
                content='SUCCESS' status='success' />
                <CustomSnackbar open={notLoggedSnack.open} onClose={()=>setNotLoggedSnack({open:false})}
                content='LOGIN FIRST' status='error'/>
                <CustomSnackbar open={tooFastSnack.open} onClose={()=>setTooFastSnack({open:false})}
                content='SORRY TOO FAST ( Interval : 15s )' status='error' />
                <CustomSnackbar open={deletedSnack.open} onClose={()=>setDeletedSnack({open:false})}
                content='Deleted' status='success' />
                <CustomSnackbar open={errorSnack.open} onClose={()=>setErrorSnack({open:false})}
                content={`ERROR : ${errorSnack.content}`} status='error' />
            </ErrorBoundary>
        </React.Fragment>
    )
}