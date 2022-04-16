export default async function loginRoute(req, res) {
  req.session.destroy();
  res.redirect("/");
}
