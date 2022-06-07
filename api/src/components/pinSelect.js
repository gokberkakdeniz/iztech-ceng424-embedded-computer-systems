import clsx from "clsx";
import React, { useCallback } from "react";
import Select from "./select";

const analogPins = [0];
const digitalPins = [...Array(11).keys()];

const PinSelect = ({ handlePinChange, pin, pinType, id, className = "" }) => {
  const onChange = useCallback(
    (value) => handlePinChange(id, value),
    [id, handlePinChange],
  );

  return (
    <Select
      id={id}
      key={id}
      name="pin-select"
      required
      onChange={onChange}
      value={pin}
      className={clsx(className, "w-28")}
    >
      {(pinType === "digital" ? digitalPins : analogPins).map((data) => (
        <Select.Option
          key={data}
          value={data}
          text={pinType[0].toUpperCase() + data}
        />
      ))}
    </Select>
  );
};

export default PinSelect;
