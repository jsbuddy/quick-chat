import React from "react";
import Head from "next/head";
import '../assets/global.css';

const App = ({ Component, pageProps }) => {
    return (
        <>
            <Head>
                <title>Quick chat</title>
            </Head>
            <Component { ...pageProps } />
        </>
    );
};

export default App;
