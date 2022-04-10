import clsx from "clsx";

function Main({ className = "", children, ...rest }) {
  return (
    <main
      className={clsx("w-full max-w-4xl mb-auto m-2 p-1 mx-auto", className)}
      {...rest}
    >
      {children}
    </main>
  );
}

export default Main;
