//import Link from "next/link";
import { useCallback } from "react";
import useUser from "../lib/useUser";
import fetchJson, { FetchError } from "../lib/fetchJson";

function RegisterForm() {
  const { mutateUser } = useUser({
    redirectTo: "/about",
    redirectIfFound: true,
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
          await fetchJson("/api/auth/register", {
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
    <form className="" onSubmit={handleSubmit}>
      <h1>Register</h1>
      <p>Please fill in this form to create an account.</p>
      <br />

      <label htmlFor="email">
        <b>Email</b>
      </label>
      <br />

      <input
        type="text"
        placeholder="Enter Email"
        name="email"
        id="email"
        required
      />

      <label htmlFor="password">
        <b>Password</b>
      </label>
      <br />
      <input
        type="password"
        placeholder="Enter Password"
        name="password"
        id="password"
        required
      />
      <br />

      <button type="submit" className="registerbtn">
        Register
      </button>
    </form>
  );
}

export default RegisterForm;
