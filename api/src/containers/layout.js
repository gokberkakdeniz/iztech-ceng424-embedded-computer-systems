import clsx from "clsx";

function Layout({ className = "", children, ...rest }) {
  return (
    <div
      className={clsx("flex flex-col w-full h-screen bg-slate-700", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Layout;
