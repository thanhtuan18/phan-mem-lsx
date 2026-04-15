<script>

// Cấu hình API - Kiểm tra kỹ URL và Token này
const API_URL = 'https://quanlytiendosanxuat.technoup.info/api/api_lsx.php'; 
const API_TOKEN = '546464646432987986745546546876vvjh44444'; 

let isEditMode = true;
let currentMasterId = null;

//window.onload = () => {
    //fetchLSXList(); 
//};

// 1. GỌI API CHUNG (Sửa lỗi bảo mật cơ bản)
async function callDB(sql) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', // Chuyển sang JSON
            },
            body: JSON.stringify({
                token: API_TOKEN,
                sql: sql
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Lỗi kết nối API');
        }
        return await response.json();
    } catch (e) {
        console.error("Lỗi gọi API:", e.message);
        // alert("Lỗi: " + e.message); // Có thể tắt alert này nếu muốn tự xử lý
        throw e;
    }
}


// --- BỔ SUNG LOGIC ĐĂNG NHẬP ---
// Kiểm tra currentUser an toàn (tránh lỗi JSON.parse)
let currentUser = null;

function checkWPLogin() {
    const appEl = document.getElementById('main-app');
    
    // 1. Kiểm tra xem User đã login vào WordPress chưa
    if (document.body.classList.contains('logged-in')) {
        // Hiện ứng dụng
        if (appEl) appEl.style.setProperty('display', 'flex', 'important');
        
        // 2. Cố gắng lấy thông tin user từ localStorage
        const saved = localStorage.getItem('user_logged');
        
        if (saved) {
            currentUser = JSON.parse(saved);
        } else {
            // 3. Nếu localStorage trống, tìm ID từ class của WordPress trong thẻ body
            // WordPress thường thêm class dạng "user-id-1" vào body
            const bodyClass = document.body.className;
            const match = bodyClass.match(/user-id-(\d+)/);
            const wpUserId = match ? parseInt(match[1]) : 1; // Mặc định là 1 nếu không tìm thấy

            currentUser = { 
                ID: wpUserId, 
                user_login: 'wp_user' 
            };
            
            // Lưu lại để các lần sau không phải quét lại body
            localStorage.setItem('user_logged', JSON.stringify(currentUser));
        }
        
        console.log("Đã xác nhận User ID:", currentUser.ID);
        fetchLSXList(); // Gọi danh sách sau khi đã chắc chắn có currentUser
    } else {
        // Nếu chưa login, đẩy ra trang login của WordPress
        const loginUrl = "/wp-login.php?redirect_to=" + encodeURIComponent(window.location.href);
        window.location.href = loginUrl;
    }
}

// Chạy kiểm tra ngay khi trang load
document.addEventListener('DOMContentLoaded', checkWPLogin);

// Hàm hỗ trợ kiểm tra trạng thái login từ phía Client
function is_user_logged_in_wp() {
    // Cách đơn giản nhất: Kiểm tra xem thanh Admin Bar của WP có tồn tại không
    // Hoặc kiểm tra class "logged-in" trong thẻ <body>
    return document.body.classList.contains('logged-in');
}


// 2. LOAD DANH SÁCH LSX (Sidebar)
async function fetchLSXList() {
    try {
        // Kiểm tra xem currentUser có tồn tại và có ID không
        const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
        if (!userId) {
            alert("Lỗi: Không xác định được thông tin người dùng. Vui lòng đăng nhập lại.");
            return;
        }

        const sql = `SELECT * FROM lsx_master WHERE user_id = ${userId} ORDER BY id DESC LIMIT 20`;
        const result = await callDB(sql);
        
        const listContainer = document.getElementById('lsx-list-items');
        if(!listContainer) return;
        
        listContainer.innerHTML = "";
        
        // SỬA TẠI ĐÂY: Kiểm tra result có phải là mảng trước khi dùng forEach
        if (Array.isArray(result)) {
            result.forEach(item => {
                const div = document.createElement('div');
                div.className = `lsx-item ${currentMasterId == item.id ? 'active' : ''}`;
                div.onclick = () => loadLSXForEdit(item.id);
                div.innerHTML = `
                    <div class="lsx-item-top">
                        <span class="code">${item.lsx_code}</span>
                        <span class="customer-tag">KH: ${item.customer_name || 'N/A'}</span>
                    </div>
                    <div class="lsx-item-name">${item.product_name || 'Chưa đặt tên'}</div>
                    <div class="lsx-item-meta">
                        <span>📅 ${item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '--/--'}</span>
                        <span class="status-dot ${item.status === 'Hoàn thành' ? 'success' : 'processing'}"></span>
                    </div>
                `;
                listContainer.appendChild(div);
            });
        }
    } catch (err) {
        console.error("Lỗi load danh sách:", err);
    }
}

// 3. LOAD CHI TIẾT ĐỂ SỬA
async function loadLSXForEdit(id) {
    isEditMode = true;
    currentMasterId = id;
    document.getElementById('mode-text').innerText = "Chỉnh sửa";

    //const masterData = await callDB(`SELECT * FROM lsx_master WHERE id = ${id}`);
    const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
    if (!userId) {
        alert("Lỗi: Không xác định được thông tin người dùng. Vui lòng đăng nhập lại.");
        return;
    }
    const masterData = await callDB(`SELECT * FROM lsx_master WHERE id = ${id} AND user_id = ${userId}`);                                  
    if (masterData && masterData.length > 0) {
        const m = masterData[0];
        document.getElementById('display-lsx-title').innerText = m.lsx_code;
        document.getElementById('master-lsx-code').value = m.lsx_code;
        document.getElementById('master-customer').value = m.customer_name;
        document.getElementById('master-product').value = m.product_name;
        document.getElementById('master-status').value = m.status;
        document.getElementById('master-note').value = m.note;
    }

    const details = await callDB(`SELECT * FROM lsx_detail WHERE master_id = ${id} ORDER BY record_date ASC`);
    const body = document.getElementById('detail-body');
    body.innerHTML = "";
    if(details.length > 0) {
        details.forEach(d => {
            addDetailRow(d.record_date, d.recorder_name, d.stage_code, d.target_quantity, d.actual_quantity, d.stage_status);
        });
    } else {
        addNewRow();
    }
    updateMasterDate();
}

// 4. CHUẨN BỊ THÊM MỚI
function prepareAddNew() {
    isEditMode = false;
    currentMasterId = null;
    document.getElementById('mode-text').innerText = "Thêm mới";
    document.getElementById('display-lsx-title').innerText = "TẠO MỚI";
    
    const newCode = "LSX-" + Math.floor(Date.now() / 1000).toString().slice(-6);
    document.getElementById('master-lsx-code').value = newCode;
    document.getElementById('master-customer').value = "";
    document.getElementById('master-product').value = "";
    document.getElementById('master-note').value = "";
    document.getElementById('detail-body').innerHTML = "";
    addNewRow();
}

// 5. LƯU DỮ LIỆU (INSERT/UPDATE)
async function saveData() {
    const btn = document.querySelector('.btn-primary');
    const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
    
    if (!userId) return alert("Không tìm thấy User ID");
        
    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    // Lấy dữ liệu từ Form (Khử dấu nháy đơn để tránh lỗi SQL)
    const m = {
        code: document.getElementById('master-lsx-code').value,
        cust: document.getElementById('master-customer').value.replace(/'/g, "''"),
        prod: document.getElementById('master-product').value.replace(/'/g, "''"),
        stat: document.getElementById('master-status').value,
        note: document.getElementById('master-note').value.replace(/'/g, "''")
    };

    try {
        let response;
        if (isEditMode && currentMasterId) {
            // TRƯỜNG HỢP SỬA: Thêm điều kiện created_by để đảm bảo chính chủ mới sửa được
            //const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
            response = await callDB(`UPDATE lsx_master SET customer_name='${m.cust}', product_name='${m.prod}', status='${m.stat}', note='${m.note}' WHERE id=${currentMasterId} AND user_id=${userId}`);
        } else {
            // TRƯỜNG HỢP THÊM MỚI: Bổ sung cột created_by vào câu INSERT
            //const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
            response = await callDB(`INSERT INTO lsx_master (lsx_code, customer_name, product_name, status, note, user_id) VALUES ('${m.code}', '${m.cust}', '${m.prod}', '${m.stat}', '${m.note}', ${userId})`);
            
            // Lấy ID vừa tạo (Nếu PHP trả về id thì dùng luôn, không thì phải Select lại)
            if (response.id) {
                currentMasterId = response.id;
            } else {
                const checkId = await callDB(`SELECT id FROM lsx_master WHERE lsx_code='${m.code}' ORDER BY id DESC LIMIT 1`);
                if (checkId && checkId.length > 0) currentMasterId = checkId[0].id;
            }
        }

        // CHỈ LƯU DETAIL NẾU CÓ MASTER ID
        if (currentMasterId) {
            // Xóa chi tiết cũ để ghi đè lại (Cơ chế đơn giản nhất cho bản Prototype)
            await callDB(`DELETE FROM lsx_detail WHERE master_id = ${currentMasterId}`);
            
            const rows = document.querySelectorAll('#detail-body tr');
            for (let row of rows) {
                const d = {
                    date: row.querySelector('.row-date').value,
                    user: row.cells[1].querySelector('input').value.replace(/'/g, "''"),
                    stg: row.cells[2].querySelector('input').value.replace(/'/g, "''"),
                    tar: row.querySelector('.val-target').value || 0,
                    act: row.querySelector('.val-actual').value || 0,
                    stat: row.querySelector('.sel-status').value
                };
                
                if(d.stg.trim() !== "") { 
                    await callDB(`INSERT INTO lsx_detail (master_id, record_date, recorder_name, stage_code, target_quantity, actual_quantity, stage_status) 
                                  VALUES (${currentMasterId}, '${d.date}', '${d.user}', '${d.stg}', ${d.tar}, ${d.act}, '${d.stat}')`);
                }
            }
            alert("Lưu dữ liệu thành công!");
        } else {
            throw new Error("Không xác định được ID của Lệnh sản xuất.");
        }

        isEditMode = true; // Chuyển sang chế độ sửa sau khi lưu thành công
        fetchLSXList(); // Cập nhật lại Sidebar
    } catch (err) {
        alert("Lỗi lưu dữ liệu: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "LƯU DỮ LIỆU";
    }
}

// --- Các hàm hỗ trợ UI ---
function addNewRow() {
    const today = new Date().toISOString().split('T')[0];
    addDetailRow(today, "", "", 0, 0, "Chưa thực hiện");
}

function addDetailRow(date, user, stage, target, actual, status) {
    const body = document.getElementById('detail-body');
    const row = document.createElement('tr');
    row.innerHTML = `
        <td><input type="date" class="row-date" value="${date}" onchange="updateMasterDate()"></td>
        <td><input type="text" value="${user || ''}"></td>
        <td><input type="text" value="${stage || ''}"></td>
        <td><input type="number" class="val-target" value="${target || 0}" oninput="updateRow(this)"></td>
        <td><input type="number" class="val-actual" value="${actual || 0}" oninput="updateRow(this)"></td>
        <td><strong class="row-pc">0%</strong></td>
        <td>
            <select class="sel-status">
                <option value="Chưa thực hiện" ${status === 'Chưa thực hiện' ? 'selected' : ''}>Chưa thực hiện</option>
                <option value="Đang thực hiện" ${status === 'Đang thực hiện' ? 'selected' : ''}>Đang thực hiện</option>
                <option value="Hoàn thành" ${status === 'Hoàn thành' ? 'selected' : ''}>Hoàn thành</option>
            </select>
        </td>
        <td><button class="btn-del" onclick="removeRow(this)">×</button></td>
    `;
    body.appendChild(row);
    updateRow(row.querySelector('.val-actual'));
}

function updateRow(el) {
    const row = el.closest('tr');
    const target = parseFloat(row.querySelector('.val-target').value) || 0;
    const actual = parseFloat(row.querySelector('.val-actual').value) || 0;
    const pcDisplay = row.querySelector('.row-pc');
    if(target > 0) {
        const pc = Math.round((actual / target) * 100);
        pcDisplay.innerText = pc + '%';
        pcDisplay.style.color = pc < 100 ? '#f59e0b' : '#10b981';
    }
}

function updateMasterDate() {
    const dates = Array.from(document.querySelectorAll('.row-date')).map(i => i.value).filter(v => v).sort();
    if(dates.length > 0) document.getElementById('master-date').value = new Date(dates[0]).toLocaleDateString('vi-VN');
}

function removeRow(btn) { btn.closest('tr').remove(); updateMasterDate(); }
function cancelAction() { if(confirm("Hủy bỏ thay đổi?")) location.reload(); }
</script>








