const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const code = urlParams.get('code');

// login
let getCookie = (cname) => {
    let name = cname + "=";
    let decodedCookie = decodeURIComponent(document.cookie);
    let ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
}

var usrname;
var rtktoken;
const displayLogin = () => {
    usrname = getCookie("rtkname");
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown">
                        <span><i class="bi bi-person-circle"></i>${usrname}</span>
                    </a>
                    <div class="dropdown-menu dropdown-menu-right navbar-dropdown" aria-labelledby="profileDropdown">
                        <a class="dropdown-item" href="./../_profile/index.html">
                            <i class="ti-settings text-primary"></i>Settings
                        </a>
                        <a class="dropdown-item" onclick="logout()">
                            <i class="ti-power-off text-primary"></i>Logout
                        </a>
                    </div>`
    // showList(r);;
}

const displayLogout = () => {
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown" onclick="login()">
                                                    <span id="profile">เข้าสู่ระบบ</span>
                                                </a>`;
}

let gotoDashboard = () => {
    location.href = "./../_dashboard/index.html";
}

let removeLineAlert = () => {
    axios.post('/apiv2/removelinealert', { eno: usrname })
        .then(r => {
            $('#lineNotify').prop('checked', false);
        })
}

const checkLineAlert = () => {
    axios.post('/apiv2/getlinealert', { eno: usrname })
        .then(r => {
            if (r.data.alert) {
                $('#lineNotify').prop('checked', true);
            }
        })
}

const showLogin = (txt1, text2) => {
    Swal.fire(
        txt1,
        text2,
        ''
    ).then((result) => {
        if (result.value) {
            gotoDashboard();
        }
    })
}

const checkLogin = () => {
    let page = "_profile";
    let gid = getCookie("rtkgid");
    usrname = getCookie("rtkname");
    rtktoken = getCookie("rtktoken");
    $("#username").val(usrname);
    $("#auth").val(auth);
    if (usrname !== "" && rtktoken !== "") {
        const headers = {
            'Authorization': `Bearer ${rtktoken}`,
            'Content-Type': 'application/json'
        }

        axios.post('/apiv2/checktoken', { username: usrname, page, gid }, { headers })
            .then(r => {
                if (r.status === 200 && r.data.auth) {
                    displayLogin();
                    checkLineAlert();
                } else {
                    showLogin("ท่านไม่มีสิทธิ์เข้าถึงหน้านี้", "หากต้องการเข้าถึงข้อมูล โปรดติดต่อ admin");
                }
            })
    } else {
        showLogin("ท่านยังไม่ได้เข้าสู่ระบบ", "กรุณา login");
    }
}

const lineRegister = () => {
    const formdata = {
        response_type: 'code',
        redirect_uri: 'https://rtk-landmos.com:3000/_profile/index.html',
        client_id: 'j5ByMj7zLPdgZr44EsTv2T',
        scope: 'notify',
        state: 'NO_STATE'
    };

    const params = Object.keys(formdata).map((key) => {
        return encodeURIComponent(key) + '=' + encodeURIComponent(formdata[key]);
    }).join('&');

    location.href = 'https://notify-bot.line.me/oauth/authorize?' + params;
}

const lineRevoke = () => {
    var gid = getCookie("rtkgid");
    axios.post('/apiv2/revokeLineToken', { gid })
        .then(r => {
            console.log(r);
        })
}

const getLineToken = () => {
    var gid = getCookie("rtkgid");
    axios.post('/apiv2/getLineToken', { code, gid }).then(r => {
        if (r.data.status === 200) {
            console.log(r);
        }
    })
}

code == null ? console.log("no code") : getLineToken();

const updateProfile = () => {
    // var gid = getCookie("rtkgid");
    let username = $("#username").val();
    let usernameth = $("#usernameth").val();
    let division = $("#division").val();
    axios.post('/apiv2/updateprofile', { username, usernameth, division })
        .then(r => {
            // console.log(r);
            Swal.fire(
                '',
                'บันทึกข้อมูลสำเร็จ',
                'success'
            )
        })
}

const selectProfile = () => {
    let username = $("#username").val();
    axios.post('/apiv2/selectprofile', { username })
        .then(r => {
            let data = r.data[0];
            $("#usernameth").val(data.usernameth);
            $("#division").val(data.division);
        })
}

// init
$("#lineNotify").on("change", function () {
    if ($(this).is(":checked")) {
        lineLogin();
    } else {
        console.log("unchecked");
        removeLineAlert();
    }
})

$(document).ready(function () {
    checkLogin();
    selectProfile();
});

// show version
axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})



