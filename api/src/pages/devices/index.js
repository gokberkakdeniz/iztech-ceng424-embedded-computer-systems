import useSWR from "swr";
import { PrivateWrapper } from "../../containers/wrappers";

function DevicesPage() {
  const { data, error } = useSWR("/api/devices");

  console.log(data, error);

  /**
   * TODO(@ebkaraca): list all devices.
   * you can use html table tags to list like excel or
   * create some wrapper component for device (username, edit button, maybe sensor count/action count in future)
   * and render them using flex row (https://tailwindcss.com/docs/flex-direction)
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

export default DevicesPage;
