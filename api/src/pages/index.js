import Link from "next/link";
import Button from "../components/button";
import { PrivateWrapper } from "../containers/wrappers";

function HomePage() {
  return (
    <PrivateWrapper>
      <Link href="/about" passHref>
        <Button as="a">about</Button>
      </Link>
    </PrivateWrapper>
  );
}

export default HomePage;
