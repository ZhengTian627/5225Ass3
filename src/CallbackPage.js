import React, { useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

function CallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.hash.substr(1));
        const idToken = urlParams.get('id_token');
        const accessToken = urlParams.get('access_token');

        if (idToken && accessToken) {
            try {
                const idTokenDecoded = jwtDecode(idToken);
                console.log('ID Token Decoded:', idTokenDecoded);
                localStorage.setItem('id_token_decoded', JSON.stringify(idTokenDecoded));
                // Get and store user_id
                const userId = idTokenDecoded.sub;
                localStorage.setItem('user_id', userId);
                // store email
                const email = idTokenDecoded.email;
                localStorage.setItem('email', email);

                const accessTokenDecoded = jwtDecode(accessToken);
                console.log('Access Token Decoded:', accessTokenDecoded);
                localStorage.setItem('access_token_decoded', JSON.stringify(accessTokenDecoded));

                localStorage.setItem('id_token', idToken);
                localStorage.setItem('access_token', accessToken);

                navigate('/');
            } catch (error) {
                console.error("Invalid tokens", error);
            }
        } else {
            console.log('id_token or access_token not found in URL.');
        }
    }, [navigate]);

    return <div>Signing you in...</div>;
}

export default CallbackPage;