/* ===========================
   TASKLY PREMIUM — Application
   Vanilla JS | LocalStorage
   =========================== */
const STORAGE_KEY = 'taskly_premium_v1';
const PRIORITY_LABELS = {
  low: 'Baixa', medium: 'Média', high: 'Alta', urgent: 'Urgente'
};
const PRIORITY_COLORS = {
  low: '#10B981', medium: '#F59E0B', high: '#FF6B6B', urgent: '#ef4444'
};
const STATUS_LABELS = {
  pending: 'Pendente',
  'in-progress': 'Em andamento',
  review: 'Revisão',
  done: 'Concluído'
};
const KANBAN_COLUMNS = ['pending', 'in-progress', 'review', 'done'];
const DEFAULT_STATE = {
  version: 1,
  user: { name: 'Pedro' },
  settings: {
    theme: 'dark-premium',
    primaryColor: '#6C63FF',
    secondaryColor: '#38BDF8',
    glowIntensity: 1,
    sidebarCollapsed: false
  },
  categories: [
    { id: 'cat-1', name: 'Estudos', color: '#6C63FF' },
    { id: 'cat-2', name: 'Trabalho', color: '#38BDF8' },
    { id: 'cat-3', name: 'Pessoal', color: '#10B981' },
    { id: 'cat-4', name: 'Desenvolvimento', color: '#a78bfa' },
    { id: 'cat-5', name: 'Financeiro', color: '#F59E0B' }
  ],
  tags: ['HTML', 'CSS', 'JavaScript', 'Escola', 'Projeto', 'Cliente'],
  projects: [
    { id: 'proj-1', name: 'ENEM 2025', color: '#6C63FF', description: 'Preparação para o ENEM', createdAt: '2025-06-01' },
    { id: 'proj-2', name: 'Portfólio Web', color: '#38BDF8', description: 'Site pessoal', createdAt: '2025-05-15' }
  ],
  tasks: [
    { id: 't1', title: 'Prova de Matemática', description: 'Capítulos 5 e 6', priority: 'high', categoryId: 'cat-1', projectId: 'proj-1', dueDate: todayStr(), color: '#FF6B6B', tags: ['Escola'], status: 'pending', createdAt: isoNow(), completedAt: null },
    { id: 't2', title: 'Trabalho de História', description: 'Segunda Guerra Mundial', priority: 'medium', categoryId: 'cat-1', projectId: 'proj-1', dueDate: addDays(1), color: '#F59E0B', tags: ['Escola'], status: 'in-progress', createdAt: isoNow(), completedAt: null },
    { id: 't3', title: 'Exercícios de Física', description: 'Lista 3', priority: 'low', categoryId: 'cat-1', projectId: '', dueDate: addDays(3), color: '#10B981', tags: ['Escola'], status: 'pending', createdAt: isoNow(), completedAt: null },
    { id: 't4', title: 'Redação — ENEM', description: 'Tema: tecnologia', priority: 'high', categoryId: 'cat-1', projectId: 'proj-1', dueDate: addDays(7), color: '#6C63FF', tags: ['Escola', 'Projeto'], status: 'review', createdAt: isoNow(), completedAt: null },
    { id: 't5', title: 'Deploy do Portfólio', description: 'Publicar na Vercel', priority: 'medium', categoryId: 'cat-4', projectId: 'proj-2', dueDate: addDays(2), color: '#38BDF8', tags: ['HTML', 'CSS', 'JavaScript'], status: 'done', createdAt: isoNow(), completedAt: isoNow() }
  ],
  goals: { daily: { target: 5, current: 0 }, weekly: { target: 25, current: 0 }, monthly: { target: 100, current: 0 } },
  calendar: { year: new Date().getFullYear(), month: new Date().getMonth(), selectedDay: null }
};
let state = loadState();
let currentView = 'dashboard';
let taskLayout = 'kanban';
let searchQuery = '';
let selectedTags = [];
/* ===== Helpers ===== */
function uid() { return 'id-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7); }
function isoNow() { return new Date().toISOString(); }
function todayStr() { return new Date().toISOString().split('T')[0]; }
function addDays(n) { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0]; }
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULT_STATE, ...JSON.parse(raw), calendar: { ...DEFAULT_STATE.calendar, ...JSON.parse(raw).calendar } };
  } catch (e) { console.warn('Load error', e); }
  return structuredClone ? structuredClone(DEFAULT_STATE) : JSON.parse(JSON.stringify(DEFAULT_STATE));
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  applyTheme();
}
function toast(msg, type = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  document.getElementById('toastContainer').appendChild(el);
  setTimeout(() => el.remove(), 3000);
}
function getGreeting() {
  const h = new Date().getHours();
  const p = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
  return `${p}, ${state.user.name}`;
}
function formatDate(str) {
  if (!str) return 'Sem prazo';
  return new Date(str + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}
function animateCounter(el, target) {
  const dur = 1000;
  const start = performance.now();
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function getCategory(id) { return state.categories.find(c => c.id === id); }
function getProject(id) { return state.projects.find(p => p.id === id); }
function filterTasks(extra = {}) {
  return state.tasks.filter(t => {
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(t.description || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (extra.category && t.categoryId !== extra.category) return false;
    if (extra.priority && t.priority !== extra.priority) return false;
    if (extra.project && t.projectId !== extra.project) return false;
    if (extra.status && t.status !== extra.status) return false;
    if (extra.date && t.dueDate !== extra.date) return false;
    return true;
  });
}
function getStats() {
  const total = state.tasks.length;
  const done = state.tasks.filter(t => t.status === 'done').length;
  const pending = state.tasks.filter(t => t.status !== 'done').length;
  const activeProjects = state.projects.filter(p => state.tasks.some(t => t.projectId === p.id && t.status !== 'done')).length;
  const goalsReached = [
    state.goals.daily.current >= state.goals.daily.target,
    state.goals.weekly.current >= state.goals.weekly.target,
    state.goals.monthly.current >= state.goals.monthly.target
  ].filter(Boolean).length;
  return { total, done, pending, activeProjects, goalsReached, rate: total ? Math.round((done / total) * 100) : 0 };
}
function updateGoalProgress() {
  const now = new Date();
  const today = todayStr();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  state.goals.daily.current = state.tasks.filter(t =>
    t.status === 'done' && t.completedAt && t.completedAt.startsWith(today)
  ).length;
  state.goals.weekly.current = state.tasks.filter(t => {
    if (t.status !== 'done' || !t.completedAt) return false;
    return new Date(t.completedAt) >= weekStart;
  }).length;
  state.goals.monthly.current = state.tasks.filter(t => {
    if (t.status !== 'done' || !t.completedAt) return false;
    return new Date(t.completedAt) >= monthStart;
  }).length;
}
function getWeeklyData() {
  const days = [0, 0, 0, 0, 0, 0, 0];
  state.tasks.forEach(t => {
    if (t.status === 'done' && t.completedAt) {
      const d = new Date(t.completedAt).getDay();
      days[d]++;
    }
  });
  return days;
}
function getMonthlyData() {
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const data = Array(daysInMonth).fill(0);
  state.tasks.forEach(t => {
    if (t.status === 'done' && t.completedAt) {
      const d = new Date(t.completedAt);
      if (d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()) {
        data[d.getDate() - 1]++;
      }
    }
  });
  return data;
}
/* ===== Theme ===== */
function applyTheme() {
  const s = state.settings;
  document.documentElement.style.setProperty('--primary', s.primaryColor);
  document.documentElement.style.setProperty('--secondary', s.secondaryColor);
  document.documentElement.style.setProperty('--glow-intensity', s.glowIntensity);
  document.body.setAttribute('data-theme', s.theme);
  if (s.sidebarCollapsed) document.getElementById('sidebar').classList.add('collapsed');
  else document.getElementById('sidebar').classList.remove('collapsed');
}
/* ===== Router ===== */
function navigate(view) {
  currentView = view;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.view === view));
  document.querySelectorAll('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  renderView(view);
  document.getElementById('sidebar').classList.remove('open');
}
function renderView(view) {
  updateGoalProgress();
  switch (view) {
    case 'dashboard': renderDashboard(); break;
    case 'tasks': renderTasks(); break;
    case 'projects': renderProjects(); break;
    case 'calendar': renderCalendar(); break;
    case 'goals': renderGoals(); break;
    case 'stats': renderStats(); break;
    case 'settings': renderSettings(); break;
  }
}
/* ===== Dashboard ===== */
function renderDashboard() {
  document.getElementById('greeting').textContent = getGreeting();
  document.getElementById('currentDate').textContent = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('sidebarUserName').textContent = state.user.name;
  const stats = getStats();
  const cards = [
    { icon: '✅', label: 'Concluídas', value: stats.done, color: '#10B981' },
    { icon: '⏳', label: 'Pendentes', value: stats.pending, color: '#F59E0B' },
    { icon: '📁', label: 'Projetos Ativos', value: stats.activeProjects, color: '#6C63FF' },
    { icon: '🎯', label: 'Metas Atingidas', value: stats.goalsReached, color: '#38BDF8' }
  ];
  const statsEl = document.getElementById('dashboardStats');
  statsEl.innerHTML = cards.map((c, i) => `
    <div class="stat-card card-3d" style="animation-delay:${i * 100}ms">
      <div class="stat-icon" style="background:${c.color}22;color:${c.color}">${c.icon}</div>
      <div><div class="stat-value" data-count="${c.value}">0</div><div class="stat-label">${c.label}</div></div>
    </div>
  `).join('');
  statsEl.querySelectorAll('[data-count]').forEach(el => animateCounter(el, +el.dataset.count));
  // Weekly chart
  const weekData = getWeeklyData();
  const maxW = Math.max(...weekData, 1);
  document.getElementById('weeklyChart').innerHTML = weekData.map((v, i) => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="--h:${(v / maxW) * 100}%;--delay:${i * 80}ms"></div>
      <span>${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'][i]}</span>
    </div>
  `).join('');
  // Project progress
  const pp = document.getElementById('projectProgress');
  if (!state.projects.length) {
    pp.innerHTML = '<div class="empty-state">Nenhum projeto criado</div>';
  } else {
    pp.innerHTML = state.projects.map(p => {
      const tasks = state.tasks.filter(t => t.projectId === p.id);
      const done = tasks.filter(t => t.status === 'done').length;
      const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
      return `<div class="progress-item">
        <div class="progress-header"><span>${p.name}</span><span>${pct}%</span></div>
        <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%;background:linear-gradient(90deg,${p.color},var(--secondary))"></div></div>
      </div>`;
    }).join('');
  }
  // Upcoming
  const upcoming = state.tasks.filter(t => t.status !== 'done').sort((a, b) => (a.dueDate || '9999') > (b.dueDate || '9999') ? 1 : -1).slice(0, 5);
  document.getElementById('upcomingTasks').innerHTML = upcoming.length
    ? upcoming.map(t => `<div class="upcoming-item"><div class="task-dot" style="background:${t.color}"></div><div style="flex:1"><strong>${t.title}</strong><br><small style="color:var(--text-muted)">${formatDate(t.dueDate)} • ${PRIORITY_LABELS[t.priority]}</small></div></div>`).join('')
    : '<div class="empty-state">Nenhuma tarefa pendente 🎉</div>';
  drawMonthlyChart();
  init3DCards();
}
function drawMonthlyChart() {
  const canvas = document.getElementById('monthlyChart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const data = getMonthlyData();
  const w = canvas.parentElement.clientWidth - 20;
  canvas.width = w; canvas.height = 160;
  const max = Math.max(...data, 1);
  const step = w / data.length;
  ctx.clearRect(0, 0, w, 160);
  ctx.beginPath();
  ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
  ctx.lineWidth = 2;
  data.forEach((v, i) => {
    const x = i * step + step / 2;
    const y = 150 - (v / max) * 130;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
  const grad = ctx.createLinearGradient(0, 0, 0, 160);
  grad.addColorStop(0, 'rgba(108,99,255,0.3)');
  grad.addColorStop(1, 'rgba(108,99,255,0)');
  ctx.lineTo(w, 160); ctx.lineTo(0, 160); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();
}
/* ===== Tasks ===== */
function getFilters() {
  return {
    category: document.getElementById('filterCategory')?.value || '',
    priority: document.getElementById('filterPriority')?.value || '',
    project: document.getElementById('filterProject')?.value || '',
    status: document.getElementById('filterStatus')?.value || '',
    date: document.getElementById('filterDate')?.value || ''
  };
}
function renderTasks() {
  populateFilterSelects();
  const tasks = filterTasks(getFilters());
  if (taskLayout === 'kanban') {
    document.getElementById('tasksKanban').hidden = false;
    document.getElementById('tasksList').hidden = true;
    renderKanban(tasks);
  } else {
    document.getElementById('tasksKanban').hidden = true;
    document.getElementById('tasksList').hidden = false;
    renderTaskList(tasks);
  }
}
function renderKanban(tasks) {
  const el = document.getElementById('tasksKanban');
  el.innerHTML = KANBAN_COLUMNS.map(status => {
    const colTasks = tasks.filter(t => t.status === status);
    return `<div class="kanban-col" data-status="${status}" ondragover="event.preventDefault()" ondrop="handleDrop(event,'${status}')">
      <div class="kanban-col-header">${STATUS_LABELS[status]} <span class="kanban-count">${colTasks.length}</span></div>
      ${colTasks.map(t => taskCardHTML(t)).join('') || '<div class="empty-state" style="padding:1rem;font-size:0.8rem">Vazio</div>'}
    </div>`;
  }).join('');
  el.querySelectorAll('.task-card').forEach(card => {
    card.addEventListener('dragstart', e => { e.dataTransfer.setData('text/task', card.dataset.id); card.classList.add('dragging'); });
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  el.querySelectorAll('.kanban-col').forEach(col => {
    col.addEventListener('dragover', () => col.classList.add('drag-over'));
    col.addEventListener('dragleave', () => col.classList.remove('drag-over'));
    col.addEventListener('drop', () => col.classList.remove('drag-over'));
  });
  bindTaskActions(el);
  init3DCards();
}
function taskCardHTML(t) {
  const cat = getCategory(t.categoryId);
  return `<div class="task-card card-3d" draggable="true" data-id="${t.id}">
    <div class="task-card-top"><div class="task-dot" style="background:${t.color}"></div><h4>${t.title}</h4></div>
    <div class="task-card-meta">
      <span class="task-badge" style="background:${PRIORITY_COLORS[t.priority]}22;color:${PRIORITY_COLORS[t.priority]}">${PRIORITY_LABELS[t.priority]}</span>
      ${cat ? `<span>${cat.name}</span>` : ''}
      <span>${formatDate(t.dueDate)}</span>
    </div>
    ${t.tags.length ? `<div class="tags-wrap" style="margin-top:0.4rem">${t.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
    <div class="task-actions">
      <button data-edit="${t.id}">Editar</button>
      <button data-delete="${t.id}">Excluir</button>
    </div>
  </div>`;
}
function renderTaskList(tasks) {
  const el = document.getElementById('tasksList');
  el.innerHTML = tasks.length ? tasks.map(t => `
    <div class="task-row">
      <div class="task-dot" style="background:${t.color}"></div>
      <div style="flex:1"><strong>${t.title}</strong><br><small style="color:var(--text-muted)">${STATUS_LABELS[t.status]} • ${PRIORITY_LABELS[t.priority]} • ${formatDate(t.dueDate)}</small></div>
      <button class="btn btn-ghost btn-sm" data-edit="${t.id}">Editar</button>
      <button class="btn btn-ghost btn-sm" data-delete="${t.id}">Excluir</button>
    </div>
  `).join('') : '<div class="empty-state">Nenhuma tarefa encontrada</div>';
  bindTaskActions(el);
}
function bindTaskActions(container) {
  container.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openTaskModal(btn.dataset.edit)));
  container.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteTask(btn.dataset.delete)));
}
window.handleDrop = function(e, status) {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/task');
  const task = state.tasks.find(t => t.id === id);
  if (task) {
    task.status = status;
    if (status === 'done' && !task.completedAt) task.completedAt = isoNow();
    if (status !== 'done') task.completedAt = null;
    saveState();
    renderTasks();
    toast('Tarefa movida!', 'success');
  }
};
function deleteTask(id) {
  if (!confirm('Excluir esta tarefa?')) return;
  state.tasks = state.tasks.filter(t => t.id !== id);
  saveState();
  renderView(currentView);
  toast('Tarefa excluída', 'success');
}
/* ===== Task Modal ===== */
function openTaskModal(id) {
  selectedTags = [];
  const modal = document.getElementById('taskModal');
  populateTaskFormSelects();
  if (id) {
    const t = state.tasks.find(x => x.id === id);
    document.getElementById('taskModalTitle').textContent = 'Editar Tarefa';
    document.getElementById('taskId').value = t.id;
    document.getElementById('taskTitle').value = t.title;
    document.getElementById('taskDescription').value = t.description || '';
    document.getElementById('taskPriority').value = t.priority;
    document.getElementById('taskCategory').value = t.categoryId;
    document.getElementById('taskProject').value = t.projectId || '';
    document.getElementById('taskDueDate').value = t.dueDate || '';
    document.getElementById('taskStatus').value = t.status;
    document.getElementById('taskColor').value = t.color;
    selectedTags = [...t.tags];
  } else {
    document.getElementById('taskModalTitle').textContent = 'Nova Tarefa';
    document.getElementById('taskForm').reset();
    document.getElementById('taskId').value = '';
    document.getElementById('taskColor').value = '#6C63FF';
  }
  renderTagSelect();
  modal.showModal();
}
function populateTaskFormSelects() {
  document.getElementById('taskCategory').innerHTML = state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
  document.getElementById('taskProject').innerHTML = '<option value="">Nenhum</option>' + state.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
}
function renderTagSelect() {
  document.getElementById('taskTagsSelect').innerHTML = state.tags.map(tag =>
    `<span class="tag ${selectedTags.includes(tag) ? 'selected' : ''}" data-tag="${tag}">${tag}</span>`
  ).join('');
  document.getElementById('taskTagsSelect').querySelectorAll('.tag').forEach(el => {
    el.addEventListener('click', () => {
      const tag = el.dataset.tag;
      selectedTags = selectedTags.includes(tag) ? selectedTags.filter(t => t !== tag) : [...selectedTags, tag];
      renderTagSelect();
    });
  });
}
function populateFilterSelects() {
  const fc = document.getElementById('filterCategory');
  const fp = document.getElementById('filterProject');
  if (!fc || fc.options.length <= 1) {
    fc.innerHTML = '<option value="">Todas</option>' + state.categories.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    fp.innerHTML = '<option value="">Todos</option>' + state.projects.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
  }
}
/* ===== Projects ===== */
function renderProjects() {
  const el = document.getElementById('projectsGrid');
  el.innerHTML = state.projects.map(p => {
    const tasks = state.tasks.filter(t => t.projectId === p.id);
    const done = tasks.filter(t => t.status === 'done').length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    return `<div class="project-card card-3d" data-id="${p.id}">
      <div class="project-color-bar" style="background:${p.color}"></div>
      <h3>${p.name}</h3>
      <p>${p.description || 'Sem descrição'}</p>
      <div class="progress-bar-bg" style="margin-bottom:0.75rem"><div class="progress-bar-fill" style="width:${pct}%;background:${p.color}"></div></div>
      <div class="project-meta"><span>${tasks.length} tarefas</span><span>${formatDate(p.createdAt)}</span></div>
    </div>`;
  }).join('') || '<div class="empty-state">Nenhum projeto. Crie o primeiro!</div>';
  el.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => openProjectModal(card.dataset.id));
  });
  init3DCards();
}
function openProjectModal(id) {
  const modal = document.getElementById('projectModal');
  if (id) {
    const p = state.projects.find(x => x.id === id);
    document.getElementById('projectModalTitle').textContent = 'Editar Projeto';
    document.getElementById('projectId').value = p.id;
    document.getElementById('projectName').value = p.name;
    document.getElementById('projectDescription').value = p.description || '';
    document.getElementById('projectColor').value = p.color;
    document.getElementById('deleteProjectBtn').hidden = false;
  } else {
    document.getElementById('projectModalTitle').textContent = 'Novo Projeto';
    document.getElementById('projectForm').reset();
    document.getElementById('projectId').value = '';
    document.getElementById('projectColor').value = '#6C63FF';
    document.getElementById('deleteProjectBtn').hidden = true;
  }
  modal.showModal();
}
/* ===== Calendar ===== */
function renderCalendar() {
  const { year, month } = state.calendar;
  const label = new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  document.getElementById('calMonthLabel').textContent = label.charAt(0).toUpperCase() + label.slice(1);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();
  const today = todayStr();

  let html = '';
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month">${daysInPrev - i}</div>`;
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayTasks = state.tasks.filter(t => t.dueDate === dateStr);
    const classes = ['cal-day'];
    if (dateStr === today) classes.push('today');
    if (state.calendar.selectedDay === dateStr) classes.push('selected');
    if (dayTasks.length) classes.push('has-tasks');
    if (dayTasks.some(t => t.status !== 'done')) classes.push('deadline');
    html += `<div class="${classes.join(' ')}" data-date="${dateStr}">${d}</div>`;
  }
  const totalCells = firstDay + daysInMonth;
  const remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= remaining; i++) {
    html += `<div class="cal-day other-month">${i}</div>`;
  }

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = html;
  grid.querySelectorAll('.cal-day[data-date]').forEach(day => {
    day.addEventListener('click', () => {
      state.calendar.selectedDay = day.dataset.date;
      saveState();
      renderCalendarDayPanel(day.dataset.date);
      grid.querySelectorAll('.cal-day').forEach(d => d.classList.remove('selected'));
      day.classList.add('selected');
    });
  });

  if (state.calendar.selectedDay) renderCalendarDayPanel(state.calendar.selectedDay);
}
function renderCalendarDayPanel(dateStr) {
  const tasks = state.tasks.filter(t => t.dueDate === dateStr);
  const title = new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  document.getElementById('calDayTitle').textContent = title.charAt(0).toUpperCase() + title.slice(1);
  document.getElementById('calDayTasks').innerHTML = tasks.length
    ? tasks.map(t => `<div class="upcoming-item"><div class="task-dot" style="background:${t.color}"></div><div style="flex:1"><strong>${t.title}</strong><br><small style="color:var(--text-muted)">${STATUS_LABELS[t.status]} • ${PRIORITY_LABELS[t.priority]}</small></div><button class="btn btn-ghost btn-sm" data-edit="${t.id}">Editar</button></div>`).join('')
    : '<div class="empty-state">Nenhuma tarefa neste dia</div>';
  bindTaskActions(document.getElementById('calDayTasks'));
}
/* ===== Goals ===== */
function renderGoals() {
  updateGoalProgress();
  const items = [
    { key: 'daily', title: 'Meta Diária', icon: '☀️' },
    { key: 'weekly', title: 'Meta Semanal', icon: '📅' },
    { key: 'monthly', title: 'Meta Mensal', icon: '🗓️' }
  ];
  document.getElementById('goalsGrid').innerHTML = items.map((item, i) => {
    const g = state.goals[item.key];
    const pct = g.target ? Math.min(Math.round((g.current / g.target) * 100), 100) : 0;
    return `<div class="goal-card card-3d" style="animation-delay:${i * 100}ms">
      <h3>${item.icon} ${item.title}</h3>
      <div class="goal-numbers">${g.current}<span> / ${g.target}</span></div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
      <small style="color:var(--text-muted)">${pct}% concluído</small>
    </div>`;
  }).join('');
  init3DCards();
}
/* ===== Stats ===== */
function renderStats() {
  updateGoalProgress();
  const stats = getStats();
  document.getElementById('statsOverview').innerHTML = [
    { icon: '📋', label: 'Total de Tarefas', value: stats.total, color: '#6C63FF' },
    { icon: '📊', label: 'Taxa de Conclusão', value: stats.rate + '%', color: '#10B981', noAnim: true },
    { icon: '🔥', label: 'Pendentes', value: stats.pending, color: '#F59E0B' },
    { icon: '📁', label: 'Projetos Ativos', value: stats.activeProjects, color: '#38BDF8' }
  ].map((c, i) => `
    <div class="stat-card" style="animation-delay:${i * 80}ms">
      <div class="stat-icon" style="background:${c.color}22;color:${c.color}">${c.icon}</div>
      <div><div class="stat-value" ${c.noAnim ? '' : `data-count="${typeof c.value === 'number' ? c.value : stats.rate}"`}>${c.noAnim ? c.value : '0'}</div><div class="stat-label">${c.label}</div></div>
    </div>
  `).join('');
  document.getElementById('statsOverview').querySelectorAll('[data-count]').forEach(el => animateCounter(el, +el.dataset.count));
  // Donut
  const rate = stats.rate;
  document.getElementById('completionDonut').innerHTML = `
    <div class="donut" style="background:conic-gradient(var(--success) ${rate * 3.6}deg, var(--bg-elevated) 0)">
      <div class="donut-inner"><div class="donut-value">${rate}%</div><div class="donut-label">Concluídas</div></div>
    </div>`;
  // Top categories
  const catCount = {};
  state.tasks.forEach(t => { if (t.categoryId) catCount[t.categoryId] = (catCount[t.categoryId] || 0) + 1; });
  const topCats = Object.entries(catCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('topCategories').innerHTML = topCats.length
    ? topCats.map(([id, count]) => {
        const cat = getCategory(id);
        const max = topCats[0][1];
        return `<div class="h-bar-item"><div class="h-bar-label"><span>${cat?.name || '—'}</span><span>${count}</span></div><div class="h-bar-bg"><div class="h-bar-fill" style="width:${(count / max) * 100}%;background:${cat?.color || 'var(--primary)'}"></div></div></div>`;
      }).join('')
    : '<div class="empty-state">Sem dados</div>';
  // Productive days
  const dayCount = {};
  state.tasks.filter(t => t.status === 'done' && t.completedAt).forEach(t => {
    const day = new Date(t.completedAt).toLocaleDateString('pt-BR', { weekday: 'short' });
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  const sortedDays = Object.entries(dayCount).sort((a, b) => b[1] - a[1]);
  document.getElementById('productiveDays').innerHTML = sortedDays.length
    ? `<div class="heatmap">${sortedDays.map(([day, count]) => `<div class="heat-cell" style="background:rgba(108,99,255,${0.1 + count * 0.08})">${day}<br><strong>${count}</strong></div>`).join('')}</div>`
    : '<div class="empty-state">Sem dados</div>';
  // Active projects
  const projCount = {};
  state.tasks.forEach(t => { if (t.projectId) projCount[t.projectId] = (projCount[t.projectId] || 0) + 1; });
  const topProj = Object.entries(projCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  document.getElementById('activeProjects').innerHTML = topProj.length
    ? topProj.map(([id, count]) => {
        const p = getProject(id);
        const max = topProj[0][1];
        return `<div class="h-bar-item"><div class="h-bar-label"><span>${p?.name || '—'}</span><span>${count} tarefas</span></div><div class="h-bar-bg"><div class="h-bar-fill" style="width:${(count / max) * 100}%;background:${p?.color || 'var(--primary)'}"></div></div></div>`;
      }).join('')
    : '<div class="empty-state">Sem dados</div>';
}
/* ===== Settings ===== */
function renderSettings() {
  document.getElementById('settingName').value = state.user.name;
  document.getElementById('settingTheme').value = state.settings.theme;
  document.getElementById('settingPrimary').value = state.settings.primaryColor;
  document.getElementById('settingSecondary').value = state.settings.secondaryColor;
  document.getElementById('settingGlow').value = state.settings.glowIntensity;
  document.getElementById('glowValue').textContent = state.settings.glowIntensity;
  document.getElementById('goalDailyTarget').value = state.goals.daily.target;
  document.getElementById('goalWeeklyTarget').value = state.goals.weekly.target;
  document.getElementById('goalMonthlyTarget').value = state.goals.monthly.target;
  document.getElementById('categoriesList').innerHTML = state.categories.map(c => `
    <div class="category-item">
      <span><span class="category-dot" style="background:${c.color}"></span>${c.name}</span>
      <button class="btn btn-ghost btn-sm" data-del-cat="${c.id}">✕</button>
    </div>
  `).join('');
  document.getElementById('categoriesList').querySelectorAll('[data-del-cat]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.categories = state.categories.filter(c => c.id !== btn.dataset.delCat);
      saveState(); renderSettings(); toast('Categoria removida');
    });
  });
  document.getElementById('tagsList').innerHTML = state.tags.map(tag =>
    `<span class="tag tag-removable">${tag}<button data-del-tag="${tag}">×</button></span>`
  ).join('');
  document.getElementById('tagsList').querySelectorAll('[data-del-tag]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      state.tags = state.tags.filter(t => t !== btn.dataset.delTag);
      saveState(); renderSettings(); toast('Tag removida');
    });
  });
}
/* ===== Effects: Particles ===== */
function initParticles() {
  const canvas = document.getElementById('particles');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;
  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  function createParticles() {
    particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      color: Math.random() > 0.5 ? '#6C63FF' : '#38BDF8',
      opacity: Math.random() * 0.4 + 0.1
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * state.settings.glowIntensity;
      ctx.fill();
      p.x += p.dx; p.y += p.dy;
      if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
    });
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(draw);
  }
  resize();
  createParticles();
  draw();
  window.addEventListener('resize', () => { resize(); createParticles(); });
}
/* ===== Effects: Cursor ===== */
function initCursor() {
  if (window.matchMedia('(hover: none)').matches) return;
  document.addEventListener('mousemove', e => {
    document.documentElement.style.setProperty('--mouse-x', e.clientX + 'px');
    document.documentElement.style.setProperty('--mouse-y', e.clientY + 'px');
  });
}
/* ===== Effects: 3D Cards ===== */
function init3DCards() {
  document.querySelectorAll('.card-3d').forEach(card => {
    card.onmousemove = e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x * 6}deg) rotateX(${-y * 6}deg) translateY(-3px)`;
    };
    card.onmouseleave = () => { card.style.transform = ''; };
  });
}
/* ===== Event Listeners ===== */
function initEvents() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.addEventListener('click', () => navigate(btn.dataset.view));
  });
  // Sidebar
  document.getElementById('sidebarToggle').addEventListener('click', () => {
    state.settings.sidebarCollapsed = !state.settings.sidebarCollapsed;
    saveState();
  });
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
  });
  document.getElementById('sidebarOverlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
  });
  // Search
  const globalSearch = document.getElementById('globalSearch');
  globalSearch.addEventListener('input', e => {
    searchQuery = e.target.value;
    if (currentView === 'tasks') renderTasks();
  });
  document.addEventListener('keydown', e => {
    if (e.key === '/' && document.activeElement !== globalSearch) {
      e.preventDefault();
      globalSearch.focus();
    }
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal[open]').forEach(m => m.close());
    }
  });
  // Quick add
  document.getElementById('quickAddBtn').addEventListener('click', () => openTaskModal());
  document.getElementById('newProjectBtn').addEventListener('click', () => openProjectModal());
  // Task layout toggle
  document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      taskLayout = btn.dataset.layout;
      renderTasks();
    });
  });
  // Filters
  document.getElementById('toggleFiltersBtn').addEventListener('click', () => {
    const panel = document.getElementById('filtersPanel');
    panel.hidden = !panel.hidden;
  });
  ['filterCategory', 'filterPriority', 'filterProject', 'filterStatus', 'filterDate'].forEach(id => {
    document.getElementById(id).addEventListener('change', renderTasks);
  });
  document.getElementById('clearFilters').addEventListener('click', () => {
    ['filterCategory', 'filterPriority', 'filterProject', 'filterStatus', 'filterDate'].forEach(id => {
      document.getElementById(id).value = '';
    });
    renderTasks();
  });
  // Task form
  document.getElementById('taskForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const data = {
      title: document.getElementById('taskTitle').value.trim(),
      description: document.getElementById('taskDescription').value.trim(),
      priority: document.getElementById('taskPriority').value,
      categoryId: document.getElementById('taskCategory').value,
      projectId: document.getElementById('taskProject').value,
      dueDate: document.getElementById('taskDueDate').value,
      status: document.getElementById('taskStatus').value,
      color: document.getElementById('taskColor').value,
      tags: [...selectedTags]
    };
    if (!data.title) { toast('Título é obrigatório', 'error'); return; }
    if (id) {
      const task = state.tasks.find(t => t.id === id);
      Object.assign(task, data);
      if (data.status === 'done' && !task.completedAt) task.completedAt = isoNow();
      if (data.status !== 'done') task.completedAt = null;
    } else {
      state.tasks.push({
        id: uid(), ...data,
        createdAt: isoNow(),
        completedAt: data.status === 'done' ? isoNow() : null
      });
    }
    saveState();
    document.getElementById('taskModal').close();
    renderView(currentView);
    toast('Tarefa salva!', 'success');
  });
  // Project form
  document.getElementById('projectForm').addEventListener('submit', e => {
    e.preventDefault();
    const id = document.getElementById('projectId').value;
    const data = {
      name: document.getElementById('projectName').value.trim(),
      description: document.getElementById('projectDescription').value.trim(),
      color: document.getElementById('projectColor').value
    };
    if (!data.name) { toast('Nome é obrigatório', 'error'); return; }
    if (id) {
      Object.assign(state.projects.find(p => p.id === id), data);
    } else {
      state.projects.push({ id: uid(), ...data, createdAt: todayStr() });
    }
    saveState();
    document.getElementById('projectModal').close();
    renderView(currentView);
    toast('Projeto salvo!', 'success');
  });
  document.getElementById('deleteProjectBtn').addEventListener('click', () => {
    const id = document.getElementById('projectId').value;
    if (!confirm('Excluir este projeto?')) return;
    state.projects = state.projects.filter(p => p.id !== id);
    state.tasks.forEach(t => { if (t.projectId === id) t.projectId = ''; });
    saveState();
    document.getElementById('projectModal').close();
    renderView(currentView);
    toast('Projeto excluído', 'success');
  });
  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => btn.closest('.modal').close());
  });
  // Calendar nav
  document.getElementById('calPrev').addEventListener('click', () => {
    state.calendar.month--;
    if (state.calendar.month < 0) { state.calendar.month = 11; state.calendar.year--; }
    saveState(); renderCalendar();
  });
  document.getElementById('calNext').addEventListener('click', () => {
    state.calendar.month++;
    if (state.calendar.month > 11) { state.calendar.month = 0; state.calendar.year++; }
    saveState(); renderCalendar();
  });
  // Settings
  document.getElementById('settingName').addEventListener('change', e => {
    state.user.name = e.target.value;
    saveState(); renderDashboard();
  });
  document.getElementById('settingTheme').addEventListener('change', e => {
    state.settings.theme = e.target.value;
    saveState();
  });
  document.getElementById('settingPrimary').addEventListener('input', e => {
    state.settings.primaryColor = e.target.value;
    saveState();
  });
  document.getElementById('settingSecondary').addEventListener('input', e => {
    state.settings.secondaryColor = e.target.value;
    saveState();
  });
  document.getElementById('settingGlow').addEventListener('input', e => {
    state.settings.glowIntensity = parseFloat(e.target.value);
    document.getElementById('glowValue').textContent = e.target.value;
    saveState();
  });
  document.getElementById('resetSettings').addEventListener('click', () => {
    if (!confirm('Restaurar configurações padrão?')) return;
    state.settings = { ...DEFAULT_STATE.settings };
    state.user.name = DEFAULT_STATE.user.name;
    saveState(); renderSettings(); applyTheme(); toast('Padrão restaurado', 'success');
  });
  document.getElementById('addCategoryBtn').addEventListener('click', () => {
    const name = document.getElementById('newCategoryName').value.trim();
    if (!name) return;
    state.categories.push({ id: uid(), name, color: document.getElementById('newCategoryColor').value });
    document.getElementById('newCategoryName').value = '';
    saveState(); renderSettings(); toast('Categoria adicionada', 'success');
  });
  document.getElementById('addTagBtn').addEventListener('click', () => {
    const name = document.getElementById('newTagName').value.trim();
    if (!name || state.tags.includes(name)) return;
    state.tags.push(name);
    document.getElementById('newTagName').value = '';
    saveState(); renderSettings(); toast('Tag adicionada', 'success');
  });
  document.getElementById('saveGoalsBtn').addEventListener('click', () => {
    state.goals.daily.target = +document.getElementById('goalDailyTarget').value || 5;
    state.goals.weekly.target = +document.getElementById('goalWeeklyTarget').value || 25;
    state.goals.monthly.target = +document.getElementById('goalMonthlyTarget').value || 100;
    saveState(); renderGoals(); toast('Metas salvas!', 'success');
  });
}
/* ===== Init ===== */
function init() {
  applyTheme();
  initParticles();
  initCursor();
  initEvents();
  setTimeout(() => {
    document.getElementById('app-loader').style.display = 'none';
    document.getElementById('app').hidden = false;
    navigate('dashboard');
  }, 1300);
}
document.addEventListener('DOMContentLoaded', init);