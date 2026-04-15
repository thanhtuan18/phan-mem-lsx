<script>
// Cấu hình API
const API_URL = 'https://quanlytiendosanxuat.technoup.info/api/api_lsx.php'; 
const API_TOKEN = '546464646432987986745546546876vvjh44444'; 

let isEditMode = true;
let currentMasterId = null;
let currentUser = null;

// 1. GỌI API CHUNG
async function callDB(sql) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        throw e;
    }
}

// 2. LOGIC ĐĂNG NHẬP (Dùng localStorage thay cho class WordPress)
function checkLogin() {
    const saved = localStorage.getItem('user_logged');
    
    if (saved) {
        currentUser = JSON.parse(saved);
        // Hiển thị App và load dữ liệu
        const appEl = document.getElementById('main-app');
        if(appEl) appEl.style.display = 'flex';
        fetchLSXList();
    } else {
        // Chuyển hướng về trang login nếu chưa có thông tin trong localStorage
        window.location.href = 'login.html';
    }
}

document.addEventListener('DOMContentLoaded', checkLogin);

// 3. LOAD DANH SÁCH LSX (Sửa user_id thành user_id)
async function fetchLSXList() {
    try {
        const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
        if (!userId) return;

        // SỬA: Dùng user_id theo đúng cấu trúc database của bạn
        const sql = `SELECT * FROM lsx_master WHERE user_id = ${userId} ORDER BY id DESC LIMIT 50`;
        const result = await callDB(sql);
        
        const listContainer = document.getElementById('lsx-list-items');
        if(!listContainer) return;
        
        listContainer.innerHTML = "";
        
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

// 4. LOAD CHI TIẾT (Sửa user_id thành user_id)
async function loadLSXForEdit(id) {
    isEditMode = true;
    currentMasterId = id;
    document.getElementById('mode-text').innerText = "Chỉnh sửa";

    const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
    if (!userId) return;

    // SỬA: Kiểm tra theo user_id
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
    if(details && details.length > 0) {
        details.forEach(d => {
            addDetailRow(d.record_date, d.recorder_name, d.stage_code, d.target_quantity, d.actual_quantity, d.stage_status);
        });
    } else {
        addNewRow();
    }
    updateMasterDate();
}

// 5. LƯU DỮ LIỆU (Sửa user_id thành user_id)
async function saveData() {
    const btn = document.querySelector('.btn-primary');
    const userId = currentUser ? (currentUser.ID || currentUser.id) : null;
    if (!userId) return alert("Không tìm thấy User ID. Vui lòng đăng nhập lại.");
        
    btn.disabled = true;
    btn.innerText = "ĐANG LƯU...";

    const m = {
        code: document.getElementById('master-lsx-code').value,
        cust: document.getElementById('master-customer').value.replace(/'/g, "''"),
        prod: document.getElementById('master-product').value.replace(/'/g, "''"),
        stat: document.getElementById('master-status').value,
        note: document.getElementById('master-note').value.replace(/'/g, "''")
    };

    try {
        if (isEditMode && currentMasterId) {
            // SỬA: WHERE user_id
            await callDB(`UPDATE lsx_master SET customer_name='${m.cust}', product_name='${m.prod}', status='${m.stat}', note='${m.note}' WHERE id=${currentMasterId} AND user_id=${userId}`);
        } else {
            // SỬA: INSERT vào user_id
            const response = await callDB(`INSERT INTO lsx_master (lsx_code, customer_name, product_name, status, note, user_id) VALUES ('${m.code}', '${m.cust}', '${m.prod}', '${m.stat}', '${m.note}', ${userId})`);
            
            if (response.id) {
                currentMasterId = response.id;
            } else {
                const checkId = await callDB(`SELECT id FROM lsx_master WHERE lsx_code='${m.code}' ORDER BY id DESC LIMIT 1`);
                if (checkId && checkId.length > 0) currentMasterId = checkId[0].id;
            }
        }

        if (currentMasterId) {
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
        }
        isEditMode = true;
        fetchLSXList();
    } catch (err) {
        alert("Lỗi lưu dữ liệu: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerText = "LƯU DỮ LIỆU";
    }
}

// Các hàm bổ trợ (Giữ nguyên logic cũ)
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
