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
    href: "/about",
    text: "About",
  },
];

function HeaderLink({ href, text, active = false, className = "" }) {
  return (
    <div
      className={clsx(
        "border-b border-transparent hover:border-yellow-400 hover:text-yellow-400",
        active && "font-bold border-white",
        className,
      )}
    >
      <Link href={href}>{text}</Link>
    </div>
  );
}

export function PrivateWrapper({ children }) {
  const { pathname } = useRouter();
  useUser({ redirectTo: "/login", redirectIf: "notLogged" });
  return (
    <>
      <Header>
        <div className="font-bold text-yellow-400">
          <Link href="/">Header</Link>
        </div>

        <Strech />
        {LinksRight.map(({ text, href }) => (
          <HeaderLink
            key={href}
            href={href}
            text={text}
            active={pathname === href}
          />
        ))}
        <UserMenu />
      </Header>
      <Main className="bg-slate-600">{children}</Main>
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
