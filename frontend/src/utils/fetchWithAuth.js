import { refreshAccessToken }
from "./auth";

export async function fetchWithAuth(
  url,
  options={}
){

  let token =
    localStorage.getItem("token");

  options.headers = {
    ...options.headers,
    authorization: token
  };

  let res = await fetch(url, options);

  if (res.status === 401) {

    token = await refreshAccessToken();

    if (!token) {

      localStorage.clear();

      window.location.href = "/login";

      return;
    }

    options.headers.authorization = token;

    res = await fetch(url, options);
  }

  return res;
}