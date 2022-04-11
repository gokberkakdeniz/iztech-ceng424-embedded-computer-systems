import { useRouter } from "next/router";
import useSWR from "swr";
import { PrivateWrapper } from "../../containers/wrappers";

function DevicePage() {
  const { query } = useRouter();
  const { data, error } = useSWR(`/api/devices/${query.id}`);

  console.log(data, error);
  /**
   * TODO(@ebkaraca): edit a device.
   * lets disguss this. i dont think this is usefull for now
   * since we have only one device not have automatic username password sharing system.
   * maybe all devices are registered to system by *system admin (i mean manufacturer)*
   * then users claim them with special key (serial number)?
   */
  return (
    <PrivateWrapper>
      data:
      <pre>{JSON.stringify(data, undefined, 2)}</pre>
      error:
      <pre>{error?.message || "null"}</pre>
      query:
      <pre>{JSON.stringify(query, undefined, 2)}</pre>
    </PrivateWrapper>
  );
}

export default DevicePage;
