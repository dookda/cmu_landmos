let lineLogin = () => {
    const state = "_profile";
    const redirect_uri = "http://localhost/_login/index.html";
    const client_id = "1656465294";
    location.href = `https://access.line.me/oauth2/v2.1/authorize?response_type=code&client_id=${client_id}&redirect_uri=${redirect_uri}&state=${usrname}&scope=profile%20openid&nonce=09876xyz`;
}

let redirect = () => {
    location.href = "./../_dashboard/index.html";
}

const logout = () => {
    document.cookie = "rtkname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtktoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtkgid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    displayLogout();
    redirect();
};