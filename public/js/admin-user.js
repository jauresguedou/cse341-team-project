let users = [];
let totalPagesCount = 0;
let page = 1;
let limit = 3;
let q = '';
let role = '';

const deleteUser = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "delete" });
    if (!res.ok) {
        alert(`Failed removing user: `);
        return
    }
    await loadUsers();
}

const updateUser = async (userId) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "put" });
    if (!res.ok) {
        alert(`Failed promoting user: `);
        return
    }
    await loadUsers();
}

const pageNumber = document.getElementById('pageNumber');
const totalPages = document.getElementById('totalPages');
const prevBtn = document.getElementById('prevPage');
const nextBtn = document.getElementById('nextPage');
const roleFilter = document.getElementById("roleFilter");

roleFilter.addEventListener("change", async (e) => {
    role = e.target.value;
    page = 1
    await loadUsers()
})

prevBtn.addEventListener("click", async () => {
    if (page > 1) {
        page--;
        await loadUsers();
    }
})

nextBtn.addEventListener("click", async () => {
    if (page < totalPagesCount) {
        page++;
        await loadUsers();
    }
})

const searchBtn = document.getElementById('searchButton');

searchBtn.addEventListener("click", async () => {
    q = document.getElementById('searchInput').value;
    page = 1;
    await loadUsers();
})

const list = document.getElementById('userList').addEventListener("click", (evt) => {
    if (evt.target.dataset.action === "delete") {
        console.log("delete user", evt.target.dataset.id)
        deleteUser(evt.target.dataset.id);
    } else {
        console.log("promote user", evt.target.dataset.id)
        updateUser(evt.target.dataset.id);
    }
})

const loadUsers = async () => {
    const res = await fetch(`/api/admin/users?page=${page}&limit=${limit}&q=${q}&roleq=${role}`);
    const resuls = await res.json();
    users = resuls.users;
    pageNumber.textContent = resuls.page;
    totalPages.textContent = resuls.totalPages;
    totalPagesCount = resuls.totalPages;
    page = resuls.page;
    limit = resuls.limit;

    render();
}

function render() {
    const listContainer = document.getElementById('userList')
    listContainer.innerHTML = '';
    for (const user of users) {
        const li = document.createElement('li');
        li.dataset.id = user._id;
        li.innerHTML = `
      <span>${user.displayName} (${user.role.name})</span>
      ${user.role.name === 'admin' ? '' : `<button data-action="promote" data-id=${user._id} class="promote">Make admin</button>`}
      <button data-action="delete" data-id=${user._id} class="delete">Delete</button>
    `;
        listContainer.appendChild(li);
    }
    updateBtn = document.querySelector()
}

document.addEventListener("DOMContentLoaded", () => {
    loadUsers();
})