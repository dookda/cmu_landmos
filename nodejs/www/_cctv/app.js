
const getStationList = () => {
    const stationListHtml = document.getElementById("stationList");
    try {
        axios.get("/apiv2/basestation")
            .then(r => {
                let stationList = r.data.data;
                stationListHtml.innerHTML += "";
                stationList.forEach(station => {
                    stationListHtml.innerHTML += `<option value="${station.stat_code}">${station.stat_code}</option>`;
                });
            });
    } catch (error) {
        console.log(error);
    }
}

// date picker initial
$('#datetimes').daterangepicker({
    autoApply: true,
    timePicker: true,
    startDate: moment().subtract(7, 'days').startOf('hour'),
    endDate: moment().startOf('hour'),
    locale: {
        format: 'M/DD hh:mm'
    }
});

const getCctv = async () => {
    try {
        let start_date = moment($('#datetimes').data('daterangepicker').startDate).format('YYYY-MM-DD HH:mm:ss');
        let end_date = moment($('#datetimes').data('daterangepicker').endDate).format('YYYY-MM-DD HH:mm:ss');
        let stat_code = $('#stationList').val();
        let data = { stat_code, start_date, end_date };
        // console.log(data);

        const response = await axios.post("/apiv2/cctv_select", data);
        let cctvImages = response.data;
        let cctvImagesHtml = document.getElementById("cctvImages");
        cctvImagesHtml.innerHTML = "";

        cctvImages.forEach(item => {
            if (item.image == "" || item.image == null || item.image == undefined || item.image.length < 25) {
                item.image = "https://www.thermaxglobal.com/wp-content/uploads/2020/05/image-not-found.jpg";
            }
            cctvImagesHtml.innerHTML += `<div class="mt-3">สถานี: ${item.stat_code} เวลา: ${moment(item.ts).format('DD-MM-YYYY HH:mm:ss')}<br>
                <img src="${item.image}" width="640px"><div>`; // Use += to append images
            // console.log(item.image);
        });
    } catch (error) {
        console.error('Error:', error);
    }
};


$('#get_cctv').click(() => getCctv());
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
    gid = getCookie("rtkgid");
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
}

const displayLogout = () => {
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown" onclick="login()">
                                                        <span><i class="bi bi-person-circle"></i>เข้าสู่ระบบ</span>
                                                    </a>`;
}

const checkLogin = () => {
    let page = "_dashboard";
    let gid = getCookie("rtkgid");
    usrname = getCookie("rtkname");
    rtktoken = getCookie("rtktoken");
    if (usrname !== "" && rtktoken !== "") {
        const headers = {
            'Authorization': `Bearer ${rtktoken}`,
            'Content-Type': 'application/json'
        }
        // console.log("sss");
        axios.post('/apiv2/checktoken', { username: usrname, page, gid }, { headers })
            .then(r => {
                if (r.status === 200 && r.data.auth) {
                    displayLogin();
                } else if (r.status === 200 && r.data.auth == false) {
                    displayLogin();
                } else {
                    displayLogout();
                }
            })
    } else {
        console.log("no login");
        displayLogout();
    }
}

const logout = () => {
    gid = defaultGid;
    document.cookie = "rtkname=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtktoken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "rtkgid=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    checkLogin();
};

const login = async () => {
    await Swal.fire({
        title: 'เข้าสู่ระบบ ',
        html: `<form>
                username: <input id="eno" type="text" class="swal2-input" autocomplete="username">
                password: <input id="pwd" type="password" class="swal2-input" autocomplete="current-password">
            </form>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'เข้าสู่ระบบ',
        preConfirm: () => {
            axios.post('/apiv2/login', {
                eno: document.getElementById('eno').value,
                pwd: document.getElementById('pwd').value
            }).then(r => {
                // console.log(r.data);
                if (r.data.status == "Verified") {
                    var expirationTime = new Date(r.data.exp * 1000);
                    var expires = expirationTime.toUTCString();

                    document.cookie = `rtkname=${r.data.eno}; expires=${expires}; path=/;`;
                    document.cookie = `rtktoken=${r.data.token}; expires=${expires}; path=/;`;
                    document.cookie = `rtkgid=${r.data.gid}; expires=${expires}; path=/;`;
                    // console.log(r.data);
                    setTimeout(() => {
                        checkLogin();
                    }, 1500);

                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Oops...',
                        text: 'username หรือ password ไม่ถูกต้อง'
                    });
                }
            });
        },
        allowOutsideClick: () => !Swal.isLoading()
    });
}

$(document).ready(function () {
    checkLogin();
    getStationList();

    // show version
    axios.get("/apiv2/version").then(r => {
        $("#version").html(r.data.version)
    })
});
