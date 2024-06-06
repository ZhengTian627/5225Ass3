import React from 'react';
import './App.css'
import ImageUpload from "./ImageUpload";
import ImageComponent from "./ImageComponent";
import ChangeTag from "./ChangeTag";
import SNSPage from "./SNSPage";
// Cognito Hosted UI Sign In link
const signInUrl = 'https://fit5225ass3.auth.us-east-1.amazoncognito.com/oauth2/authorize?client_id=4v3rmhci41ucvfo6t490v8e7lh&response_type=token&scope=email+openid&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fcallback%2F'
function HomePage() {
    const isLoggedIn = localStorage.getItem('access_token') !== null;

    // 函数用于清空身份和访问令牌并刷新页面
    const handleSignOut = () => {
        localStorage.removeItem('id_token');
        localStorage.removeItem('access_token');
        window.location.reload();
    };

    return (
        <div className="App">
            <header className="App-header">
                {isLoggedIn ? (
                    <div>
                    <div className="App-content">
                        <div><ImageComponent /></div>
                        <div><ImageUpload /></div>
                        <div><ChangeTag /></div>
                        <div><SNSPage /></div>
                    </div>
                    <button className="sign-out-button" onClick={handleSignOut}>Sign Out</button>
                </div>
                
                    // <div>
                    //     <ImageComponent />
                    //     <ImageUpload />
                    //     <ChangeTag />
                    //     <SNSPage />
                    //     <button onClick={handleSignOut}>Sign Out</button>
                    // </div>
                ) : (
                    <a href={signInUrl}>Sign In</a>
                )
                }
            </header>
        </div>
    )
        ;
}

export default HomePage;

