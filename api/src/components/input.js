import clsx from "clsx";
import React from "react";

const Input = React.forwardRef(
  ({ className = "", multiline = false, ...rest }, ref) => {
    const Component = multiline ? "textarea" : "input";

    return (
      <Component
        className={clsx(
          "border border-black rounded bg-gray-800 h-8 p-1 my-2 outline-none",
          "focus:border-yellow-400",
          className,
        )}
        {...rest}
        ref={ref}
      ></Component>
    );
  },
);

Input.displayName = "Input";

export default Input;
