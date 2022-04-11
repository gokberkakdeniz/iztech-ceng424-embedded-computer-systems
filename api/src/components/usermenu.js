import useUser from "../lib/useUser";
import { Menu } from "@headlessui/react";
import clsx from "clsx";
import Link from "next/link";

function UserMenu() {
  const { user } = useUser();

  return (
    <Menu as="div" className="relative flex-0 inline-block text-left">
      <Menu.Button className="font-bold bg-yellow-400 px-2 py-0.5 rounded-md cursor-pointer text-black">
        {user?.email || "..."}
      </Menu.Button>

      <Menu.Items className="bg-gray-600 rounded absolute right-0 w-40 mt-2 origin-top-right divide-y focus:outline-none">
        <Menu.Item>
          {({ active }) => (
            <div
              className={clsx(
                active && "text-yellow-400",
                "group flex border-none rounded-md items-center w-full px-2 py-2 text-sm",
              )}
            >
              <Link href="/api/auth/logout">Logout</Link>
            </div>
          )}
        </Menu.Item>
      </Menu.Items>
    </Menu>
  );
}

export default UserMenu;
