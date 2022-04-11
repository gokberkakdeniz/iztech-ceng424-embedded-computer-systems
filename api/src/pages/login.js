import { useCallback } from "react";
import useUser from "../lib/useUser";
import fetchJson, { FetchError } from "../lib/fetchJson";
import { PublicWrapper } from "../containers/wrappers";
import Input from "../components/input";
import Button from "../components/button";

function LoginPage() {
  const { mutateUser } = useUser({
    redirectTo: "/",
    redirectIf: "logged",
  });

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      const body = {
        email: event.currentTarget.email.value,
        password: event.currentTarget.password.value,
      };

      try {
        mutateUser(
          await fetchJson("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          }),
        );
      } catch (error) {
        if (error instanceof FetchError) {
          console.log(error.data.message);
        } else {
          console.error("An unexpected error happened:", error);
        }
      }
    },
    [mutateUser],
  );

  return (
    <PublicWrapper>
      <form className="text-center" onSubmit={handleSubmit}>
        <h1 className="font-bold">Login</h1>
        <p>lorem ipsum login</p>
        <br />

        <label htmlFor="email">
          <b>Email</b>
        </label>
        <br />

        <Input
          type="text"
          placeholder="Enter Email"
          name="email"
          id="email"
          required
        />
        <br />

        <label htmlFor="password">
          <b>Password</b>
        </label>
        <br />
        <Input
          type="password"
          placeholder="Enter Password"
          name="password"
          id="password"
          required
        />
        <br />

        <Button type="submit">Login</Button>
      </form>
    </PublicWrapper>
  );
}

export default LoginPage;
