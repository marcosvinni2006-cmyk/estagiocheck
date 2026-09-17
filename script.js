const FOLLOWUP_DAYS = 21;

let applications = [];

const newAppBtn = document.getElementById("newAppBtn");
const modal = document.getElementById("modal");
const cancelBtn = document.getElementById("cancelBtn");
const appForm = document.getElementById("appForm");
const modalTitle = document.getElementById("modalTitle");

const editIdInput = document.getElementById("editId");
const companyInput = document.getElementById("company");
const positionInput = document.getElementById("position");
const dateInput = document.getElementById("date");
const statusInput = document.getElementById("status");
const linkInput = document.getElementById("link");
const notesInput = document.getElementById("notes");

const tableBody = document.getElementById("tableBody");
const searchInput = document.getElementById("search");
const filterStatus = document.getElementById("filterStatus");
const filterCompany = document.getElementById("filterCompany");
const followupAlert = document.getElementById("followupAlert");

const summaryEls = {
    total: document.getElementById("total"),
    applied: document.getElementById("applied"),
    interview: document.getElementById("interview"),
    offer: document.getElementById("offer"),
    rejected: document.getElementById("rejected")
};

function loadFromStorage() {
    const saved = localStorage.getItem("estagioCheckApplications");

    if (saved) {
        applications = JSON.parse(saved);
    } else {
        applications = [];
    }
}

function saveToStorage() {
    localStorage.setItem(
        "estagioCheckApplications",
        JSON.stringify(applications)
    );
}

function openModal() {
    modalTitle.textContent = "Nova candidatura";
    appForm.reset();
    editIdInput.value = "";
    modal.classList.remove("hidden");
}

function closeModal() {
    modal.classList.add("hidden");
}

function handleFormSubmit(event) {
    event.preventDefault();

    const id = editIdInput.value;

    const newApp = {
        id: id ? Number(id) : Date.now(),
        company: companyInput.value.trim(),
        position: positionInput.value.trim(),
        date: dateInput.value,
        status: statusInput.value,
        link: linkInput.value.trim(),
        notes: notesInput.value.trim()
    };

    if (id) {
        const index = applications.findIndex(
            app => app.id === Number(id)
        );

        if (index !== -1) {
            applications[index] = newApp;
        }
    } else {
        applications.push(newApp);
    }

    saveToStorage();
    closeModal();
    renderSummary();
    renderTable();
    updateFollowupAlert();
}

function editApp(id) {
    const app = applications.find(
        item => item.id === id
    );

    if (!app) return;

    editIdInput.value = app.id;
    modalTitle.textContent = "Editar candidatura";

    companyInput.value = app.company;
    positionInput.value = app.position;
    dateInput.value = app.date;
    statusInput.value = app.status;
    linkInput.value = app.link;
    notesInput.value = app.notes;

    modal.classList.remove("hidden");
}

function deleteApp(id) {
    const confirmed = confirm(
        "Tem certeza que deseja excluir esta candidatura?"
    );

    if (!confirmed) return;

    applications = applications.filter(
        app => app.id !== id
    );

    saveToStorage();
    renderSummary();
    renderTable();
    updateFollowupAlert();
}

function renderSummary() {
    summaryEls.total.textContent = applications.length;

    summaryEls.applied.textContent =
        applications.filter(
            app => app.status === "Aplicado"
        ).length;

    summaryEls.interview.textContent =
        applications.filter(
            app => app.status === "Entrevista"
        ).length;

    summaryEls.offer.textContent =
        applications.filter(
            app => app.status === "Oferecido"
        ).length;

    summaryEls.rejected.textContent =
        applications.filter(
            app => app.status === "Recusado"
        ).length;
}

function renderTable() {
    const search = searchInput.value.toLowerCase().trim();
    const status = filterStatus.value;
    const company = filterCompany.value.toLowerCase().trim();

    const filtered = applications.filter(app => {

        const matchesSearch =
            app.company.toLowerCase().includes(search) ||
            app.position.toLowerCase().includes(search);

        const matchesStatus =
            !status || app.status === status;

        const matchesCompany =
            !company ||
            app.company.toLowerCase().includes(company);

        return (
            matchesSearch &&
            matchesStatus &&
            matchesCompany
        );
    });

    tableBody.innerHTML = "";

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align:center;">
                    Nenhuma candidatura encontrada.
                </td>
            </tr>
        `;

        return;
    }

    filtered.forEach(app => {

        const row = document.createElement("tr");

        const statusClass =
            app.status.toLowerCase();

        row.innerHTML = `
            <td>${escapeHtml(app.company)}</td>

            <td>${escapeHtml(app.position)}</td>

            <td>${formatDate(app.date)}</td>

            <td>
                <span class="status-badge status-${statusClass}">
                    ${escapeHtml(app.status)}
                </span>
            </td>

            <td>
                ${
                    app.link
                    ? `<a href="${escapeAttribute(app.link)}"
                         target="_blank"
                         rel="noopener">
                         Abrir
                       </a>`
                    : "-"
                }
            </td>

            <td>
                ${escapeHtml(app.notes || "-")}
            </td>

            <td>
                <button
                    class="actions-btn edit"
                    data-id="${app.id}">
                    Editar
                </button>

                <button
                    class="actions-btn delete"
                    data-id="${app.id}">
                    Excluir
                </button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    document
        .querySelectorAll(".actions-btn.edit")
        .forEach(button => {

            button.addEventListener("click", () => {
                editApp(Number(button.dataset.id));
            });
        });

    document
        .querySelectorAll(".actions-btn.delete")
        .forEach(button => {

            button.addEventListener("click", () => {
                deleteApp(Number(button.dataset.id));
            });
        });
}

function updateFollowupAlert() {

    const today = new Date();

    const oldApps = applications.filter(app => {

        const appDate =
            new Date(app.date + "T00:00:00");

        const diffTime =
            today - appDate;

        const diffDays =
            Math.floor(
                diffTime /
                (1000 * 60 * 60 * 24)
            );

        return (
            diffDays > FOLLOWUP_DAYS &&
            app.status !== "Oferecido" &&
            app.status !== "Recusado"
        );
    });

    if (oldApps.length === 0) {
        followupAlert.classList.add("hidden");
        return;
    }

    let html = `
        <strong>
            ⚠️ ${oldApps.length}
            candidatura(s) podem precisar de follow-up.
        </strong>
        <br><br>
    `;

    oldApps.forEach(app => {

        const appDate =
            new Date(app.date + "T00:00:00");

        const diffDays =
            Math.floor(
                (today - appDate) /
                (1000 * 60 * 60 * 24)
            );

        html += `
            • ${escapeHtml(app.company)}
            - ${escapeHtml(app.position)}
            (${diffDays} dias)
            <br>
        `;
    });

    followupAlert.innerHTML = html;
    followupAlert.classList.remove("hidden");
}

function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeAttribute(text) {
    return String(text)
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function formatDate(date) {

    if (!date) {
        return "-";
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

newAppBtn.addEventListener(
    "click",
    openModal
);

cancelBtn.addEventListener(
    "click",
    closeModal
);

appForm.addEventListener(
    "submit",
    handleFormSubmit
);

searchInput.addEventListener(
    "input",
    renderTable
);

filterStatus.addEventListener(
    "change",
    renderTable
);

filterCompany.addEventListener(
    "input",
    renderTable
);

loadFromStorage();
renderSummary();
renderTable();
updateFollowupAlert();