let users = [];


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
    const res = await fetch("/api/admin/users");
    users = await res.json();
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