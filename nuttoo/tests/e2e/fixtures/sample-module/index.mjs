const input = JSON.parse(process.env.NUTTOO_INPUT_JSON || "{}");
const msg = typeof input.message === "string" ? input.message : "hello";
if (msg.length > 4096) {
  throw new Error("message too large");
}
console.log(JSON.stringify({ echo: msg }));
