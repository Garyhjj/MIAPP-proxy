const crypto = require("crypto"),
  key = require("../constants").jwtKey;

function jwtCheck(ctx, next) {
  let token = ctx.request.headers.access_token;
  let errMes, decode;
  if (!token || typeof token !== "string") {
    errMes = "未授权";
  } else {
    let [header, content, sign] = token.split(".");
    const user = JSON.parse(Buffer.from(content, "base64").toString());
    if (
      crypto
      .createHmac("sha256", header + "." + content)
      .update(key)
      .digest("base64") !== sign
    ) {
      errMes = "授权無效";
    } else {
      if (new Date().getTime() - new Date(user.Exp).getTime() > 0) {
        errMes = "授权已過期";
      } else {
        ctx.miUser = user;
      }
    }
  }
  if (errMes) {
    ctx.response.status = 401;
    ctx.response.body = errMes;
  } else {
    return next();
  }
}

module.exports = jwtCheck;