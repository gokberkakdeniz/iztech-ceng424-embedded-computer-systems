import { useRouter } from "next/router";
import useSWR from "swr";
import ErrorComponent from "../../../components/error";
import Loading from "../../../components/loading";
import { withPrivateWrapper } from "../../../components/withPrivateWrapper";

function DevicePage() {
  const { query } = useRouter();

  const { data: sensorsData, error: sensorsError } = useSWR(
    `/api/devices/${query.deviceId}/sensors`,
  );

  if (sensorsError) {
    return (
      <ErrorComponent description={sensorsError.message || "Unknown error."} />
    );
  }

  if (!sensorsData) {
    return <Loading />;
  }

  return (
    <>
      <pre>{JSON.stringify(sensorsData, null, 2)}</pre>
    </>
  );
}

export default withPrivateWrapper(DevicePage);
