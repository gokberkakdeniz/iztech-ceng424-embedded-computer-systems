import { useRouter } from "next/router";
import { PrivateWrapper } from "../../../../containers/wrappers";

function NewActionPage() {
  const { query } = useRouter();

  /**
   * TODO: create a new action for the device.
   */
  return <PrivateWrapper>new action for {query.deviceId}</PrivateWrapper>;
}

export default NewActionPage;
