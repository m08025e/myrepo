const tableSelect = document.getElementById("table-select");
const tableHeaderRow = document.getElementById("table-header-row");
const tableBody = document.getElementById("table-body");
const emptyState = document.getElementById("empty-state");
const newRecordBtn = document.getElementById("new-record-btn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalClose = document.getElementById("modal-close");
const modalCancel = document.getElementById("modal-cancel");
const modalSubmit = document.getElementById("modal-submit");
const recordForm = document.getElementById("record-form");
const formFields = document.getElementById("form-fields");

let currentTable = null;
let currentFields = [];
let editingId = null;

async function fetchJSON(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "エラーが発生しました。" }));
    throw new Error(error.detail || "エラーが発生しました。");
  }
  return response.json();
}

async function loadTableOptions() {
  const tables = await fetchJSON("/api/tables");
  tableSelect.innerHTML = "";
  tables.forEach((table, index) => {
    const option = document.createElement("option");
    option.value = table.value;
    option.textContent = table.label;
    tableSelect.appendChild(option);
    if (index === 0) {
      currentTable = table.value;
    }
  });

  if (currentTable) {
    tableSelect.value = currentTable;
    await refreshTable();
  }
}

async function refreshTable() {
  if (!currentTable) return;
  const data = await fetchJSON(`/api/data/${currentTable}`);
  currentFields = data.fields;
  renderTable(data.columns, data.records);
}

function renderTable(columns, records) {
  tableHeaderRow.innerHTML = "";
  tableBody.innerHTML = "";

  columns.forEach((column) => {
    const th = document.createElement("th");
    th.textContent = column.label;
    tableHeaderRow.appendChild(th);
  });

  const actionHeader = document.createElement("th");
  actionHeader.textContent = "操作";
  tableHeaderRow.appendChild(actionHeader);

  if (records.length === 0) {
    emptyState.classList.remove("hidden");
    return;
  }

  emptyState.classList.add("hidden");

  records.forEach((record) => {
    const row = document.createElement("tr");
    row.dataset.id = record.id;

    columns.forEach((column) => {
      const cell = document.createElement("td");
      const value = record[column.key];
      cell.textContent = formatCellValue(column.key, value);
      row.appendChild(cell);
    });

    const actionCell = document.createElement("td");
    actionCell.classList.add("action-cell");

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.className = "action-button";
    editButton.textContent = "編集";
    editButton.addEventListener("click", () => openModal("update", record));

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "action-button delete";
    deleteButton.textContent = "削除";
    deleteButton.addEventListener("click", () => handleDelete(record.id));

    actionCell.appendChild(editButton);
    actionCell.appendChild(deleteButton);
    row.appendChild(actionCell);

    tableBody.appendChild(row);
  });
}

function formatCellValue(key, value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "boolean") {
    return value ? "有効" : "無効";
  }
  if (key === "created_at") {
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleString();
  }
  if (key === "hire_date") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return value;
}

function openModal(mode, record = null) {
  editingId = mode === "update" && record ? record.id : null;
  modalTitle.textContent = mode === "update" ? "レコード更新" : "新規登録";
  modalSubmit.textContent = mode === "update" ? "更新" : "保存";
  modal.dataset.mode = mode;
  buildForm(record);
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  recordForm.reset();
  editingId = null;
}

function buildForm(record) {
  formFields.innerHTML = "";
  currentFields.forEach((field) => {
    const wrapper = document.createElement("div");
    wrapper.className = "form-field";

    const label = document.createElement("label");
    label.htmlFor = `field-${field.name}`;
    label.textContent = field.label;

    let input;
    if (field.input_type === "checkbox") {
      input = document.createElement("input");
      input.type = "checkbox";
      input.id = `field-${field.name}`;
      input.name = field.name;
      input.checked = record ? Boolean(record[field.name]) : true;
    } else {
      input = document.createElement("input");
      input.type = field.input_type || "text";
      input.id = `field-${field.name}`;
      input.name = field.name;
      input.value = record && record[field.name] !== null && record[field.name] !== undefined ? formatInputValue(field, record[field.name]) : "";
    }

    if (field.required) {
      input.required = true;
    }

    wrapper.appendChild(label);
    wrapper.appendChild(input);
    formFields.appendChild(wrapper);
  });
}

function formatInputValue(field, value) {
  if (value === null || value === undefined) return "";
  if (field.input_type === "date") {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split("T")[0];
    }
  }
  return value;
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!currentTable) return;

  const payload = {};
  for (const field of currentFields) {
    const input = recordForm.elements[field.name];
    if (!input) continue;

    if (field.input_type === "checkbox") {
      payload[field.name] = input.checked;
      continue;
    }

    const value = input.value.trim();
    if (field.required && value === "") {
      alert(`${field.label}を入力してください。`);
      input.focus();
      return;
    }

    if (value === "") {
      payload[field.name] = null;
    } else if (field.input_type === "number") {
      const numberValue = Number(value);
      if (Number.isNaN(numberValue)) {
        alert(`${field.label}には数値を入力してください。`);
        input.focus();
        return;
      }
      payload[field.name] = numberValue;
    } else {
      payload[field.name] = value;
    }
  }

  const mode = modal.dataset.mode;
  const url = mode === "update" ? `/api/data/${currentTable}/${editingId}` : `/api/data/${currentTable}`;
  const method = mode === "update" ? "PUT" : "POST";

  try {
    await fetchJSON(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    closeModal();
    await refreshTable();
  } catch (error) {
    alert(error.message);
  }
}

async function handleDelete(recordId) {
  const confirmed = window.confirm("本当に削除しますか？");
  if (!confirmed) return;

  try {
    await fetchJSON(`/api/data/${currentTable}/${recordId}`, { method: "DELETE" });
    await refreshTable();
  } catch (error) {
    alert(error.message);
  }
}

newRecordBtn.addEventListener("click", () => openModal("create"));
modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);
recordForm.addEventListener("submit", handleSubmit);

tableSelect.addEventListener("change", async (event) => {
  currentTable = event.target.value;
  await refreshTable();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !modal.classList.contains("hidden")) {
    closeModal();
  }
});

modal.addEventListener("click", (event) => {
  if (event.target === modal) {
    closeModal();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  loadTableOptions().catch((error) => {
    alert(error.message);
  });
});
