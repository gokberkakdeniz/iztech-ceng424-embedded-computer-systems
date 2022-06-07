import React from "react";
import Select from "./select";

const PinSelect = ({ state, id, pinList = [], className = "" }) => {
  if (pinList.length === 0) return <span>No available pins.</span>;

  return (
    <Select
      id={id}
      key={id}
      name="pin-select"
      required
      onChange={(value) => state[1](id, value)}
      value={state[0]}
      className={className}
    >
      {pinList.map((data) => (
        <Select.Option key={data} value={data} text={data} />
      ))}
    </Select>
  );
};

export default PinSelect;
