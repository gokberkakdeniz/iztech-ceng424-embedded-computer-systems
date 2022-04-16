import { useRouter } from "next/router";
import Button from "../../../../components/button";
import Input from "../../../../components/input";
import Select from "../../../../components/select";
import { PrivateWrapper } from "../../../../containers/wrappers";
import fetchJson from "../../../../lib/fetchJson";

function NewActionPage() {
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
      push(`${asPath.split("/").slice(0, -1).join("/")}/${id}`);
    } catch (e) {
      console.log("oppsss", e);
    }
  };

  return (
    <PrivateWrapper>
      <form className="text-center" onSubmit={handleSubmit}>
        <label htmlFor="name">
          <b>Name</b>
        </label>
        <br />
        <Input
          type="text"
          placeholder="My action name"
          name="name"
          id="name"
          className="w-full"
          required
          autoComplete="off"
        />
        <br />

        <label htmlFor="condition">
          <b>Condition</b>
        </label>
        <br />
        <Input
          type="text"
          placeholder="dht_temperature > 11 and dht_humidity <= 22"
          name="condition"
          id="condition"
          className="w-full"
          required
          autoComplete="off"
        />
        <br />

        <label htmlFor="waitFor">
          <b>Wait for next run (seconds)</b>
        </label>
        <br />
        <Input
          type="number"
          placeholder="10"
          name="waitFor"
          id="waitFor"
          className="w-full"
          style={{ appearance: "textfield" }}
          defaultValue={10}
          required
          autoComplete="off"
        />
        <br />

        <label htmlFor="type">
          <b>Type</b>
        </label>
        <br />
        <Select
          id="type"
          name="type"
          placeholder="An action to trigger when conditions are met"
          required
        >
          <Select.Option value="telegram" text="Send Telegram Message" />
          <Select.Option value="email" text="Send Email" />
          <Select.Option value="power_on" text="Power On Device" />
        </Select>
        <br />

        <Button type="submit">Create</Button>
      </form>
    </PrivateWrapper>
  );
}

export default NewActionPage;
