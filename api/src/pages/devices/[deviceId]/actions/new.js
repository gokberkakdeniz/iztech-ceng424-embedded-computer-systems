import { useRouter } from "next/router";
import ActionForm from "../../../../components/forms/action";
import { PrivateWrapper } from "../../../../containers/wrappers";
import db from "../../../../lib/db";
import fetchJson from "../../../../lib/fetchJson";
import { toast } from "react-hot-toast";

function NewActionPage({ sensorNames }) {
  const { query, push, asPath } = useRouter();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const body = {
      name: event.target.name.value,
      condition: event.target.condition.value,
      waitFor: Number.parseInt(event.target.waitFor.value),
      type: event.target.type.value,
    };

    try {
      const { id } = await fetchJson(`/api/devices/${query.deviceId}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      toast.success("Created successfully.");
      push(`${asPath.split("/").slice(0, -1).join("/")}/${id}`);
    } catch (e) {
      toast.error("An error occurred.");
      console.log(e);
    }
  };

  return (
    <PrivateWrapper>
      <ActionForm
        sensorNames={sensorNames}
        submitText={"Create"}
        onSubmit={handleSubmit}
      />
    </PrivateWrapper>
  );
}

export async function getServerSideProps(context) {
  const { deviceId } = context.params;

  const [sensorNames = [], error] = await db.getSensorsByDeviceId(deviceId);

  if (error) console.log(error);

  return { props: { sensorNames } };
}

export default NewActionPage;
