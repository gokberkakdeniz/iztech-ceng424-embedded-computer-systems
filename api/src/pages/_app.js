import "../styles/globals.css";
import { SWRConfig } from "swr";
import fetchJson from "../lib/fetchJson";
import Layout from "../containers/layout";

function ApplicationRoot({ Component, pageProps }) {
  return (
    <SWRConfig
      value={{
        fetcher: fetchJson,
      }}
    >
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </SWRConfig>
  );
}

export default ApplicationRoot;
