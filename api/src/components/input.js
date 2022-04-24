import clsx from "clsx";
import React from "react";

const Input = React.forwardRef(({ className = "", ...rest }, ref) => {
  return (
    <input
      className={clsx(
        "border border-black rounded bg-gray-800 h-8 p-1 my-2 outline-none",
        "focus:border-yellow-400",
        className,
      )}
      {...rest}
      ref={ref}
    ></input>
  );
});

Input.displayName = "Input";

export default Input;
