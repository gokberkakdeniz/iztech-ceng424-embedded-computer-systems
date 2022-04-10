import clsx from "clsx";

function Button({
  className = "",
  as: Component = "button",
  children,
  ...rest
}) {
  return (
    <Component
      className={clsx(
        "bg-gray-800 text-center",
        "py-0.5 px-2 h-8 m-1 min-w-min w-32",
        "border border-black rounded outline-none",
        className,
      )}
      {...rest}
    >
      {children}
    </Component>
  );
}

export default Button;
