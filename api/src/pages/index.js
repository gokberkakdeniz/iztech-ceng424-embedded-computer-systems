import { PrivateWrapper } from "../containers/wrappers";

function HomePage() {
  return (
    <PrivateWrapper>
      <div className="text-center h-48">
        Wellcome to Rodones General Purpose Weather Measurement System
      </div>
    </PrivateWrapper>
  );
}

export default HomePage;
