import React, { useCallback } from "react";
import Select from "./select";

const pinListDefault = [];

const PinSelect = ({
  handlePinChange,
  pin,
  id,
  pinList = pinListDefault,
  className = "",
}) => {
  const onChange = useCallback(
    (value) => handlePinChange(id, value),
    [id, handlePinChange],
  );

  if (pinList.length === 0) return <span>No available pins.</span>;

  return (
    <Select
      id={id}
      key={id}
      name="pin-select"
      required
      onChange={onChange}
      value={pin}
      className={className}
    >
      {pinList.map((data) => (
        <Select.Option key={data} value={data} text={data} />
      ))}
    </Select>
  );
};

export default PinSelect;
