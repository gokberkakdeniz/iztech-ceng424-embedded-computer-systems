import "../styles/globals.css";
import { SWRConfig } from "swr";
import fetchJson from "../lib/fetchJson";
import Layout from "../containers/layout";
import AlertContainer from "../containers/toaster";

function ApplicationRoot({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
      }}
    >
      <AlertContainer />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SWRConfig>
  );
}

export default ApplicationRoot;
