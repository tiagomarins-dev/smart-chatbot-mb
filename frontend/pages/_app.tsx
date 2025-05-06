import '../styles/globals.css';
import '../styles/dark-mode-tables.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { AuthProvider } from '../src/contexts/AuthContext';
import { RealtimeProvider } from '../src/contexts/RealtimeContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

// Import Bootstrap CSS (if you're using it)
import 'bootstrap/dist/css/bootstrap.min.css';

// Import Bootstrap JS
import { useEffect } from 'react';

function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    // Import Bootstrap JS on client-side
    if (typeof window !== 'undefined') {
      require('bootstrap/dist/js/bootstrap.bundle.min.js');
    }
  }, []);

  return (
    <>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Smart CRM</title>
      </Head>
      
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
            <Component {...pageProps} />
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
    </>
  );
}

export default MyApp;