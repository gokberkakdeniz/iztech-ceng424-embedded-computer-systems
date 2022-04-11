import { useEffect } from "react";
import Router from "next/router";
import useSWR from "swr";

export default function useUser({ redirectTo = "", redirectIf = "none" } = {}) {
  const {
    data: user,
    mutate: mutateUser,
    error,
  } = useSWR("/api/auth/me", {
    errorRetryCount: 0,
  });

  useEffect(() => {
    if (!redirectTo || (!user && !error)) return;

    if (
      (redirectIf === "logged" && user && !error) ||
      (redirectIf === "notLogged" &&
        error?.data?.error === true &&
        error?.data?.message === "unauthorized")
    ) {
      Router.push(redirectTo);
    }
  }, [user, error, redirectIf, redirectTo]);

  return { user, mutateUser };
}
