import useSWR from "swr";
import { useRouter } from "next/router";
import { PrivateWrapper } from "../../../../containers/wrappers";

function ActionPage() {
  const { query } = useRouter();
  const { data, error } = useSWR(
    `/api/devices/${query.deviceId}/actions/${query.actionId}`,
  );

  console.log(data, error);

  /**
   * TODO: show action of the device.
   */
  return (
    <PrivateWrapper>
      data:
      <pre>{JSON.stringify(data, undefined, 2)}</pre>
      error:
      <pre>{error?.message || "null"}</pre>
    </PrivateWrapper>
  );
}

export default ActionPage;
