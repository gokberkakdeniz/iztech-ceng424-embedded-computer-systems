import Link from "next/link";
import Button from "../components/button";
import { PrivateWrapper } from "../containers/wrappers";

function HomePage() {
  return (
    <PrivateWrapper>
      <Button>
        <Link href="/about">about</Link>
      </Button>
    </PrivateWrapper>
  );
}

export default HomePage;
