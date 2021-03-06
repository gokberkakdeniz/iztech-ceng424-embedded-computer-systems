import { Popover } from "@headlessui/react";
import Button from "../button";
import Input from "../input";
import Select from "../select";
import { VariableIcon, ChatIcon } from "@heroicons/react/solid";
import { useCallback, useEffect, useRef, useState } from "react";
import fetchJSON from "../../lib/fetchJson";
import RenderLabel from "../renderLabel";

function TelegramActionForm({ data = {}, token = "" }) {
  const [polling, setPolling] = useState(false);
  const chatIdInputRef = useRef();

  useEffect(() => {
    if (!polling) return;

    let intervalId = 0;

    const fetchChatId = () =>
      fetchJSON(`/api/webhooks/telegram/${token}`)
        .then((data) => {
          if (data) {
            chatIdInputRef.current.value = data;
            clearInterval(intervalId);
            setPolling(false);
          }
        })
        .catch(console.log);

    intervalId = setInterval(fetchChatId, 1000);
  }, [polling, token]);

  return (
    <>
      {RenderLabel(
        "Receiver Id",
        "prop__chat_id",
        "You should first send message to the bot.",
      )}
      <div className="flex">
        <Input
          type="text"
          placeholder="484845455445"
          name="prop__chat_id"
          id="prop__chat_id"
          className="w-full"
          required
          autoComplete="off"
          defaultValue={data.props?.chat_id}
          ref={chatIdInputRef}
        />
        <Button
          as="div"
          className="my-2 mr-0.5 w-8 shrink-0"
          title="Get my chat id"
        >
          <a
            href={`https://t.me/rodones_bot?start=token_${token}`}
            target="_blank"
            rel="noreferrer"
            onClick={() => setPolling(true)}
          >
            <ChatIcon className="h-4 w-4 align-middle pb-1 inline-block" />
          </a>
        </Button>
      </div>

      {RenderLabel("Message", "prop__message")}
      <Input
        placeholder="Temperature is {dht_temperature}!"
        name="prop__message"
        id="prop__message"
        className="w-full h-fit"
        autoComplete="off"
        defaultValue={data.props?.message}
        rows="2"
        maxLength={1000}
        multiline
        required
      />
    </>
  );
}

function EmailActionForm({ data = {} }) {
  return (
    <>
      {RenderLabel("Receiver Email", "prop__to")}
      <Input
        type="text"
        placeholder="some@mail.com"
        name="prop__to"
        id="prop__to"
        className="w-full"
        required
        autoComplete="off"
        defaultValue={data.props?.to}
      />

      {RenderLabel("Subject", "prop__subject")}
      <Input
        type="text"
        placeholder="Subject"
        name="prop__subject"
        id="prop__subject"
        className="w-full"
        required
        autoComplete="off"
        defaultValue={data.props?.subject}
      />

      {RenderLabel("Message", "prop__message")}
      <Input
        placeholder="Temperature is {dht_temperature}!"
        name="prop__message"
        id="prop__message"
        className="w-full h-fit"
        autoComplete="off"
        defaultValue={data.props?.message}
        rows="2"
        maxLength={1000}
        multiline
        required
      />
    </>
  );
}

function ActionForm({
  data = {},
  telegramGetChatIdToken = "",
  submitText,
  onSubmit,
  sensorNames,
}) {
  const conditionInputRef = useRef();
  const [type, setType] = useState(data.type);

  const handleInsertSensorName = useCallback(
    (name, close) => () => {
      const input = conditionInputRef.current;
      const selectionStart = input.selectionStart;
      const selectionEnd = input.selectionEnd;
      const value = input.value;

      input.value =
        value.slice(0, selectionStart) + name + value.slice(selectionEnd);
      input.selectionStart = selectionStart + name.length;
      input.selectionEnd = input.selectionStart;

      close(conditionInputRef.current);
    },
    [conditionInputRef],
  );

  const renderAdditionalOptions = useCallback((type, data, { token }) => {
    switch (type) {
      case "telegram":
        return <TelegramActionForm token={token} data={data} />;
      case "email":
        return <EmailActionForm token={token} data={data} />;
      case "power_on":
        return <></>;
      default:
        return null;
    }
  }, []);

  return (
    <form className="text-center" onSubmit={onSubmit}>
      {RenderLabel("Name", "name")}
      <Input
        type="text"
        placeholder="My action name"
        name="name"
        id="name"
        className="w-full"
        required
        autoComplete="off"
        defaultValue={data.name}
      />

      {RenderLabel(
        "Condition",
        "condition",
        "You can use arithmetic operations, comparisons, boolean logic, and builtin functions like abs/ceil/floor/log/max/min/round/sqrt/random...",
      )}
      <div className="flex">
        <Input
          type="text"
          placeholder="dht_temperature > 11 and dht_humidity <= 22"
          name="condition"
          id="condition"
          className="flex-grow"
          required
          autoComplete="off"
          ref={conditionInputRef}
          defaultValue={data.condition}
        />

        <Popover className="relative">
          <Popover.Button
            as={Button}
            className="my-2 mr-0.5 w-8 shrink-0"
            title="Insert sensor name"
          >
            <VariableIcon className="w-4" />
          </Popover.Button>

          <Popover.Panel className="flex flex-wrap z-50 bg-gray-800 rounded absolute right-1 w-max max-w-xs">
            {({ close }) =>
              sensorNames.map((name) => (
                <Button
                  key={name}
                  type="button"
                  className="flex-grow w-full bg-yellow-400 font-bold text-black h-fit"
                  onClick={handleInsertSensorName(name, close)}
                >
                  {name}
                </Button>
              ))
            }
          </Popover.Panel>
        </Popover>
      </div>

      {RenderLabel(
        "Wait for next run (seconds)",
        "waitFor",
        "If condition met a again, action won't be trigger for given threshold value.",
      )}
      <Input
        type="number"
        placeholder="10"
        name="waitFor"
        id="waitFor"
        className="w-full"
        style={{ appearance: "textfield" }}
        required
        autoComplete="off"
        defaultValue={data.wait_for ?? data.waitFor ?? 10}
      />

      {RenderLabel("Type", "type")}
      <Select
        id="type"
        name="type"
        placeholder="An action to trigger when conditions are met"
        required
        onChange={setType}
        value={type}
      >
        <Select.Option value="telegram" text="Send Telegram Message" />
        <Select.Option value="email" text="Send Email" />
        <Select.Option value="power_on" text="Power On Device" />
      </Select>

      {renderAdditionalOptions(type, data, { token: telegramGetChatIdToken })}

      <Button type="submit">{submitText}</Button>
    </form>
  );
}

export default ActionForm;
