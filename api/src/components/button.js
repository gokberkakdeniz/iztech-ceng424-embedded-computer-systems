import React from "react";
import clsx from "clsx";

const Button = React.forwardRef(
  ({ className = "", as: Component = "button", children, ...rest }, ref) => {
    return (
      <Component
        className={clsx(
          className,
          "bg-gray-800 text-center",
          "py-0.5 px-2 h-8 m-1 min-w-min w-32",
          "border border-black rounded outline-none",
        )}
        {...rest}
        ref={ref}
      >
        {children}
      </Component>
    );
  },
);

Button.displayName = "Button";

export default Button;
