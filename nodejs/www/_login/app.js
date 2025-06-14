var url_string = window.location;
var url = new URL(url_string);

var code = url.searchParams.get("code");
var state = url.searchParams.get("state");

let redirect = () => {
    location.href = "./../_profile/index.html";
}

let refreshPage = () => {
    location.reload(true);
}

axios.post('/apiv2/linelogin', { code, eno: state }).then(r => {
    // console.log(r)
    redirect();
});