import clsx from "clsx";

function Input({ className = "", ...rest }) {
  return (
    <input
      className={clsx(
        "border border-black rounded bg-gray-800 px-1 py-1 mt-2 mb-2 outline-none",
        className,
      )}
      {...rest}
    ></input>
  );
}

export default Input;
