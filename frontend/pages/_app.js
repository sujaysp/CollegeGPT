import "../styles/globals.css";

import { GoogleOAuthProvider } from "@react-oauth/google";

const googleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function App({ Component, pageProps }) {
  return (
    <GoogleOAuthProvider clientId={googleClientId || ""}>
      <Component {...pageProps} />
    </GoogleOAuthProvider>
  );
}