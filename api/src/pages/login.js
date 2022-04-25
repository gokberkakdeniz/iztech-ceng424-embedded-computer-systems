import { useCallback, useState } from "react";
import useUser from "../lib/useUser";
import fetchJson, { FetchError } from "../lib/fetchJson";
import { PublicWrapper } from "../containers/wrappers";
import Input from "../components/input";
import Button from "../components/button";

function LoginPage() {
  const [errorMessage, setErrorMessage] = useState("");
  const { mutateUser } = useUser({
    redirectTo: "/",
    redirectIf: "logged",
  });

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();

      setErrorMessage("");

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
        let message = "An unexpected error happened.";

        if (error instanceof FetchError) {
          message = error.data.message;
        } else {
          console.error(error);
        }

        setErrorMessage(message);
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
        <div className="font-bold text-red-500">{errorMessage}</div>
      </form>
    </PublicWrapper>
  );
}

export default LoginPage;
