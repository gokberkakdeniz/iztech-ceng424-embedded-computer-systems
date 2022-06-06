import { PrivateWrapper } from "../containers/wrappers";

export function withPrivateWrapper(Component) {
  const wrapped = (props) => (
    <PrivateWrapper>
      <Component {...props} />
    </PrivateWrapper>
  );

  wrapped.displayName = `withPrivateWrapper(${
    Component.displayName ?? Component.name
  })`;

  return wrapped;
}
