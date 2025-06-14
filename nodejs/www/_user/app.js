const editUser = (gid, userid, username, email, user_type, alert, approved) => {
    // console.log(gid);
    Swal.fire({
        title: 'แก้ไขข้อมูลผู้ใช้งาน',
        html: `<form >
            <div class="row mb-2 align-items-center">
                <div class="col-sm-4 text-left">userid </div>
                <div class="col-sm-8 text-left"><input id="userid" type="text" class="form-control" value="${userid}" disabled>  </div>
            </div>
            <div class="row mb-2 align-items-center">
                <div class="col-sm-4 text-left">username </div>
                <div class="col-sm-8 text-left"><input id="username" type="text" class="form-control" value="${username}">  </div>
            </div>
            <div class="row mb-2 align-items-center">
                <div class="col-sm-4 text-left">email </div>
                <div class="col-sm-8 text-left"><input id="email" type="text" class="form-control" value="${email}"> </div>
            </div>
            <div class="row mb-2 align-items-center">
                <div class="col-sm-4 text-left">user_type </div>
                <div class="col-sm-8 text-left">
                    <select class="form-control" id="user_type">
                        <option value="Administrator" ${user_type == "Administrator" ? "selected" : null}>Administrator</option>
                        <option value="Super User" ${user_type == "Super User" ? "selected" : null}>Super User</option>
                        <option value="User" ${user_type == "User" ? "selected" : null}>User</option>
                    </select>
                </div>
            </div>
        </form>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'บันทึก',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            axios.post('/apiv2/edituser', {
                gid: gid,
                userid: document.getElementById('userid').value,
                username: document.getElementById('username').value,
                email: document.getElementById('email').value,
                user_type: document.getElementById('user_type').value,
            }).then(r => {
                $('#table').DataTable().ajax.reload();
            })
        }
    })
}

const deleteUser = (gid, username) => {
    Swal.fire({
        title: 'ลบข้อมูลผู้ใช้งาน',
        html: `<form> </form>`,
        focusConfirm: false,
        showCancelButton: true,
        confirmButtonText: 'ยืนยัน',
        cancelButtonText: 'ยกเลิก',
        preConfirm: () => {
            axios.post('/apiv2/deleteuser', { gid, username }).then(r => {
                $('#table').DataTable().ajax.reload();
            })
        }
    })
}

const showtable = (header) => {
    table = $('#table').DataTable({
        ajax: {
            type: 'POST',
            url: '/apiv2/getuser',
            // data: { "userid": 'admin' },
            headers: header,
            dataSrc: 'data',
            destroy: true
        },
        columns: [
            { data: 'gid', visible: false, },
            {
                data: 'id',
                render: (data, type, row, meta) => {
                    return `${meta.row + 1}`
                }
            },
            { data: 'username' },
            { data: 'email' },
            { data: 'user_type' },
            { data: 'dt' },
            {
                data: null,
                render: function (data, type, row, meta) {
                    return `<button class="btn btn-inverse-success" onclick="editUser(${data.gid},'${data.userid}', '${data.username}', '${data.email}', '${data.user_type}', ${data.alert}, '${data.approved}')"><i class="bi bi-tools"></i>แก้ไข</button>
                    <button class="btn btn-inverse-danger" onclick="deleteUser(${data.gid},'${data.username}')"><i class="bi bi-trash3"></i>ลบ</button>`
                },
            },
        ],
        "order": [[1, 'asc']],
        "paging": true,
        "ordering": true,
        "info": false,
        "filter": true,
        "autoWidth": true,
        // dom: 'Bfrtip',
        // buttons: [
        //     'excel', 'print'
        // ],
        "responsive": true,
        "scrollX": true,
        // order: [[5, 'asc']],
    });
}

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
    // showList(r);;
}

const displayLogout = () => {
    document.getElementById("profile").innerHTML = `<a class="nav-link dropdown-toggle" href="#" data-toggle="dropdown" id="profileDropdown" onclick="login()">
                                                        <span><i class="bi bi-person-circle"></i>เข้าสู่ระบบ</span>
                                                    </a>`;
}

let gotoDashboard = () => {
    location.href = "./../_dashboard/index.html";
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
    let page = "_user";
    let gid = getCookie("rtkgid");
    usrname = getCookie("rtkname");
    rtktoken = getCookie("rtktoken");
    if (usrname !== "" && rtktoken !== "") {
        const headers = {
            'Authorization': `Bearer ${rtktoken}`,
            'Content-Type': 'application/json'
        }

        axios.post('/apiv2/checktoken', { username: usrname, page, gid }, { headers })
            .then(r => {
                if (r.status === 200 && r.data.auth) {
                    displayLogin();
                    showtable(headers);
                } else {
                    showLogin("ท่านไม่มีสิทธิ์เข้าถึงหน้านี้", "หากต้องการเข้าถึงข้อมูล โปรดติดต่อ admin");
                }
            })
    } else {
        showLogin("ท่านยังไม่ได้เข้าสู่ระบบ", "กรุณา login");
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

$("#update").text(moment().format("DD-MM-YYYY HH:ss น."));

$(document).ready(function () {
    checkLogin();
});

// show version
axios.get("/apiv2/version").then(r => {
    $("#version").html(r.data.version)
})