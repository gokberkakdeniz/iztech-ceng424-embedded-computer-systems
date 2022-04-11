import Link from "next/link";
import Strech from "../components/strech";
import Header from "../containers/header";
import Main from "../containers/main";
import Footer from "../containers/footer";
import UserMenu from "../components/usermenu";
import useUser from "../lib/useUser";
import clsx from "clsx";
import { useRouter } from "next/router";

const LinksRight = [
  {
    href: "/devices",
    text: "Devices",
  },
  {
    href: "/actions",
    text: "Actions",
  },
];

export function PrivateWrapper({ children }) {
  const { pathname } = useRouter();
  useUser({ redirectTo: "/login", redirectIf: "notLogged" });
  return (
    <>
      <Header>
        <Link href="/">Header</Link>
        <Strech />
        {LinksRight.map(({ text, href }) => (
          <div
            key={href}
            className={clsx(
              "border-b border-transparent hover:border-yellow-400 hover:text-yellow-400",
              pathname === href && "font-bold border-white",
            )}
          >
            <Link href={href}>{text}</Link>
          </div>
        ))}
        <UserMenu />
      </Header>
      <Main className="bg-slate-600 ">{children}</Main>
      <Footer>lorem ipsum footer...</Footer>
    </>
  );
}

export function PublicWrapper({ children }) {
  return (
    <>
      <Main>{children}</Main>
      <Footer>lorem ipsum footer...</Footer>
    </>
  );
}
