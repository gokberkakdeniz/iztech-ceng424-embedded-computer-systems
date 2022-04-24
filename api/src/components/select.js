import { Fragment, useState, Children, isValidElement, useMemo } from "react";
import { Combobox, Transition } from "@headlessui/react";
import { CheckIcon, SelectorIcon } from "@heroicons/react/solid";
import clsx from "clsx";

export default function Select({
  className,
  defaultValue = "",
  placeholder = "",
  required = false,
  id,
  name,
  children,
}) {
  const [selected, setSelected] = useState(defaultValue);
  const [query, setQuery] = useState("");

  const options = useMemo(() => {
    const result = {};
    Children.forEach(children, (element) => {
      if (!isValidElement(element)) return;

      const { text, value } = element.props;

      result[value] = { text, value, element };
    });
    return result;
  }, [children]);

  const filteredOptions =
    query === ""
      ? options
      : Object.fromEntries(
          Object.entries(options).filter(([, option]) =>
            option.text
              .toLowerCase()
              .replace(/\s+/g, "")
              .includes(query.toLowerCase().replace(/\s+/g, "")),
          ),
        );

  return (
    <div className={clsx("my-2", className)}>
      <Combobox value={selected} onChange={setSelected}>
        <div className="relative">
          <div
            className={clsx(
              "relative bg-gray-800 text-center",
              "py-0.5 px-2 h-8 min-w-min w-full",
              "border border-black rounded outline-none",
              className,
            )}
          >
            <input type="hidden" id={id} name={name} value={selected} />
            <Combobox.Input
              placeholder={placeholder}
              className="w-full bg-transparent outline-none"
              displayValue={(value) => options[value]?.text || ""}
              onChange={(event) => setQuery(event.target.value)}
              required={required}
              autoComplete="off"
            />
            <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
              <SelectorIcon
                className="w-5 h-5 text-gray-400"
                aria-hidden="true"
              />
            </Combobox.Button>
          </div>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            afterLeave={() => setQuery("")}
          >
            <Combobox.Options className="absolute w-full border border-black rounded py-1 mt-1 overflow-auto text-base bg-gray-800 max-h-60 ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {filteredOptions.length === 0 && query !== "" ? (
                <div className="cursor-default select-none relative py-2 px-4 ">
                  Nothing found.
                </div>
              ) : (
                Object.values(filteredOptions).map(({ element }) => element)
              )}
            </Combobox.Options>
          </Transition>
        </div>
      </Combobox>
    </div>
  );
}

Select.Option = function Option({ text, value, children = null }) {
  return (
    <Combobox.Option
      className={({ active }) =>
        `cursor-default select-none relative py-2 pl-10 pr-4 ${
          active ? "text-black bg-yellow-400" : "text-white"
        }`
      }
      value={value}
    >
      {({ selected, active }) => (
        <>
          <span
            className={`block truncate ${
              selected ? "font-medium" : "font-normal"
            }`}
          >
            {children ?? text}
          </span>
          {selected ? (
            <span
              className={`absolute inset-y-0 left-0 flex items-center pl-3 ${
                active ? "text-white" : "text-teal-600"
              }`}
            >
              <CheckIcon className="w-5 h-5" aria-hidden="true" />
            </span>
          ) : null}
        </>
      )}
    </Combobox.Option>
  );
};
