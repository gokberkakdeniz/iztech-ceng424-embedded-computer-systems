import clsx from "clsx";

function Header({ className = "", children, ...rest }) {
  return (
    <header
      className={clsx(
        "w-full h-12 px-4 flex-shrink-0",
        "bg-gray-800 text-bold",
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
