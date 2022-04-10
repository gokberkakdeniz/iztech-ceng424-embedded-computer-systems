import Link from "next/link";
import Strech from "../components/strech";
import Header from "../containers/header";
import Main from "../containers/main";
import Footer from "../containers/footer";

export function PrivateWrapper({ children }) {
  return (
    <>
      <Header>
        <Link href="/">Header</Link>
        <Strech />
        <Link href="/about">about</Link>
        <Link href="/about">about</Link>
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
