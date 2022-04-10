import clsx from "clsx";

function Footer({ className = "", children, ...rest }) {
  return (
    <footer
      className={clsx("w-full max-w-4xl m-2 p-1 mx-auto", className)}
      {...rest}
    >
      {children}
    </footer>
  );
}

export default Footer;
