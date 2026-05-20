const API = "https://save-money-yyv1.onrender.com";

export async function refreshAccessToken() {

  try {

    // localStorage থেকে refresh token নিচ্ছে
    const refreshToken =
      localStorage.getItem("refreshToken");

    // backend এ request পাঠাচ্ছে
    const res = await fetch(
      `${API}/refresh-token`,
      {
        method: "POST",

        headers: {
          "Content-Type":"application/json"
        },

        body: JSON.stringify({
          refreshToken
        })
      }
    );

    // response json করছে
    const data = await res.json();

    // নতুন access token পেলে
    if (data.accessToken) {

      // save করছে
      localStorage.setItem(
        "token",
        data.accessToken
      );

      // return করছে
      return data.accessToken;
    }

    // না পেলে null
    return null;

  } catch {

    return null;

  }

}