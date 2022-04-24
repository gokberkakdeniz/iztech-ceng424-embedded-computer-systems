import useSWR from "swr";
import { useRouter } from "next/router";
import { PrivateWrapper } from "../../../../containers/wrappers";
import db from "../../../../lib/db";
import ActionForm from "../../../../components/forms/action";
import Loading from "../../../../components/loading";
import ErrorComponent from "../../../../components/error";
import fetchJson from "../../../../lib/fetchJson";
import { toast } from "react-hot-toast";

function ActionPage({ sensorNames }) {
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
    <PrivateWrapper>
      {!data && !error && <Loading />}
      {error && <ErrorComponent description={error.message} />}
      {data && (
        <ActionForm
          data={data}
          sensorNames={sensorNames}
          submitText={"Save"}
          onSubmit={handleSubmit}
        />
      )}
    </PrivateWrapper>
  );
}

export async function getServerSideProps(context) {
  const { deviceId } = context.params;

  const [sensorNames = [], error] = await db.getSensorsByDeviceId(deviceId);

  if (error) console.log(error);

  return { props: { sensorNames } };
}

export default ActionPage;
