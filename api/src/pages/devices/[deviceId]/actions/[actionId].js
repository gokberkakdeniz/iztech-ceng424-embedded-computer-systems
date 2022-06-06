import useSWR from "swr";
import { useRouter } from "next/router";
import db from "../../../../lib/db";
import ActionForm from "../../../../components/forms/action";
import Loading from "../../../../components/loading";
import ErrorComponent from "../../../../components/error";
import fetchJson from "../../../../lib/fetchJson";
import { toast } from "react-hot-toast";
import { withPrivateWrapper } from "../../../../components/withPrivateWrapper";

function ActionPage({ sensorNames, telegramGetChatIdToken }) {
  const { query } = useRouter();
  const { data, error, mutate } = useSWR(
    `/api/devices/${query.deviceId}/actions/${query.actionId}`,
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    const body = {
      name: event.target.name.value,
      condition: event.target.condition.value,
      waitFor: Number.parseInt(event.target.waitFor.value),
      type: event.target.type.value,
      props: Object.fromEntries(
        Array.from(event.target.elements)
          .filter((element) => element.name?.startsWith("prop__"))
          .map((element) => [element.name.substring(6), element.value]),
      ),
    };

    try {
      const data = await fetchJson(
        `/api/devices/${query.deviceId}/actions/${query.actionId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );

      mutate(data);
      toast.success("Updated successfully.");
    } catch (e) {
      toast.error("An error occured.");
      console.log(e);
    }
  };

  return (
    <>
      {!data && !error && <Loading />}
      {error && <ErrorComponent description={error.message} />}
      {data && (
        <ActionForm
          data={data}
          sensorNames={sensorNames}
          submitText={"Save"}
          onSubmit={handleSubmit}
          telegramGetChatIdToken={telegramGetChatIdToken}
        />
      )}
    </>
  );
}

export async function getServerSideProps(context) {
  const { deviceId, actionId } = context.params;

  const [sensorNames = [], error] = await db.getSensorsByDeviceId(deviceId);
  const telegramGetChatIdToken = actionId;

  if (error) console.log(error);

  return { props: { sensorNames, telegramGetChatIdToken } };
}

export default withPrivateWrapper(ActionPage);
