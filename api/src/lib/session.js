export const sessionOptions = {
  password: process.env.COOKIE_SECRET,
  cookieName: "session_id",
  cookieOptions: {
    secure: false && process.env.NODE_ENV === "production",
  },
};
