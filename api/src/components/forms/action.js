import { Popover } from "@headlessui/react";
import Button from "../button";
import Input from "../input";
import Select from "../select";
import { QuestionMarkCircleIcon, PuzzleIcon } from "@heroicons/react/solid";
import { useCallback, useRef } from "react";

function ActionForm({ data = {}, submitText, onSubmit, sensorNames }) {
  const conditionInputRef = useRef();

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

  const renderLabel = useCallback(
    (text, htmlFor, description) => (
      <label htmlFor={htmlFor} className="flex justify-center gap-1">
        <b>{text}</b>

        {description && (
          <span title={description}>
            <QuestionMarkCircleIcon className="h-full w-4" />
          </span>
        )}
      </label>
    ),
    [],
  );

  return (
    <form className="text-center" onSubmit={onSubmit}>
      {renderLabel("Name", "name")}
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

      {renderLabel(
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

        <Popover className="">
          <Popover.Button
            as={Button}
            className="my-2 mr-0.5 w-8 shrink-0"
            title="Insert sensor name"
          >
            <PuzzleIcon className="w-4" />
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

      {renderLabel(
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

      {renderLabel("Type", "type")}
      <Select
        id="type"
        name="type"
        placeholder="An action to trigger when conditions are met"
        required
        defaultValue={data.type}
      >
        <Select.Option value="telegram" text="Send Telegram Message" />
        <Select.Option value="email" text="Send Email" />
        <Select.Option value="power_on" text="Power On Device" />
      </Select>
      <br />

      <Button type="submit">{submitText}</Button>
    </form>
  );
}

export default ActionForm;
