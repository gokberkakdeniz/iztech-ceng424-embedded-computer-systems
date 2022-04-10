import clsx from "clsx";

function Navigation({ className = "", children, ...rest }) {
  return (
    <nav
      className={clsx(
        "bg-gray-800 w-full h-12 px-2",
        "text-bold",
        "flex items-center gap-2",
        className,
      )}
      {...rest}
    >
      {children}
    </nav>
  );
}

export default Navigation;
