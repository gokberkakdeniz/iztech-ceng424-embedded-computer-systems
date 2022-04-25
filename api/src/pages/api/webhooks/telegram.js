export default async function telegramWebHookRoute(req, res) {
  console.log({
    method: req.method,
    query: req.query,
    url: req.url,
    header: req.headers,
    body: req.body,
  });

  res.send({ error: false, message: "ok" });
}
