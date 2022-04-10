import clsx from "clsx";

function Header({ className = "", children, ...rest }) {
  return (
    <header
      className={clsx(
        "bg-gray-800 w-full h-12 px-4",
        "text-bold",
        "flex items-center gap-2",
        className,
      )}
      {...rest}
    >
      {children}
    </header>
  );
}

export default Header;
