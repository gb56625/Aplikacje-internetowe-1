const Todo = {
  tasks: JSON.parse(localStorage.getItem('tasks')) || [],
  dates: JSON.parse(localStorage.getItem('dates')) || [],
  status: JSON.parse(localStorage.getItem('status')) || [],
  term: document.getElementById('search'),

  save() {
    localStorage.setItem('tasks', JSON.stringify(this.tasks));
    localStorage.setItem('dates', JSON.stringify(this.dates));
    localStorage.setItem('status', JSON.stringify(this.status));
  },

  addTask() {
  const input = document.getElementById('add');
  const dateInput = document.getElementById('addDate');

  const task = input.value.trim();               // <— ważne: walidujemy przycięty tekst
  const date = dateInput.value;
  const today = new Date().toISOString().slice(0, 10);

  if (task.length < 3 || task.length > 255) {
    alert('Treść zadania musi mieć między 3 a 255 znaków i nie może zaczynać ani kończyć się spacją.');
    return;
  }
  if (date && date < today) {
    alert('Data nie może być z przeszłości.');
    return;
  }

  this.tasks.push(task);
  this.dates.push(date || 'No due date');
  this.status.push('unchecked');
  this.save();

  input.value = '';
  dateInput.value = '';

  this.draw();
},



  draw() {
    this.sortList();
    const ul = document.getElementById('list');
    ul.innerHTML = '';

    this.tasks.forEach((task, i) => {
      const li = document.createElement('li');
      li.className = this.status[i];

      // ✅ Edycja treści
      const p = document.createElement('p');
      p.textContent = task;
      p.onclick = () => this.editText(i, p, li);
      li.appendChild(p);

      // 📅 Edycja daty
      const time = document.createElement('time');
      time.textContent = this.dates[i];
      time.onclick = () => this.editDate(i, time, li);
      li.appendChild(time);

      // ☑️ Zmiana statusu
      const checkBtn = document.createElement('button');
      const checkIcon = document.createElement('i');
      checkIcon.className = this.status[i] === 'checked' ? 'fa fa-check-square-o' : 'fa fa-square-o';
      checkBtn.onclick = () => this.toggleStatus(i);
      checkBtn.appendChild(checkIcon);
      li.appendChild(checkBtn);

      // ❌ Usuwanie
      const closeBtn = document.createElement('button');
      closeBtn.innerHTML = '<i class="fa fa-close"></i>';
      closeBtn.onclick = () => this.removeTask(i);
      li.appendChild(closeBtn);

      ul.appendChild(li);
    });

    if (this.term.value.length >= 2) this.filterTasks();
  },

  editText(i, p, li) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.tasks[i];
    input.className = 'editPara';
    li.replaceChild(input, p);
    input.focus();

    input.onblur = () => {
      const val = input.value.trim();
      if (val.length < 3 || val.length > 255) alert('Treść zadania musi mieć między 3 a 255 znaków.');
      else this.tasks[i] = val;
      this.save();
      this.draw();
    };
  },

  editDate(i, time, li) {
    const input = document.createElement('input');
    input.type = 'date';
    input.value = this.dates[i] !== 'bezterminowo' ? this.dates[i] : '';
    li.replaceChild(input, time);
    input.focus();

    input.onblur = () => {
      this.dates[i] = input.value || 'bezterminowo';
      this.save();
      this.draw();
    };
  },

  toggleStatus(i) {
    const now = new Date().toISOString().slice(0, 10);
    if (this.status[i] === 'unchecked') {
      if (this.dates[i] === 'bezterminowo') this.dates[i] = now;
      this.status[i] = 'checked';
    } else this.status[i] = 'unchecked';
    this.save();
    this.draw();
  },

  removeTask(i) {
    this.tasks.splice(i, 1);
    this.dates.splice(i, 1);
    this.status.splice(i, 1);
    this.save();
    this.draw();
  },

  sortList() {
    const combined = this.tasks.map((t, i) => ({
      task: t,
      date: this.dates[i],
      status: this.status[i]
    }));

    combined.sort((a, b) => {
      if (a.status !== b.status) return a.status === 'checked' ? 1 : -1;
      if (a.date === 'bezterminowo') return 1;
      if (b.date === 'bezterminowo') return -1;
      return a.date.localeCompare(b.date);
    });

    this.tasks = combined.map(x => x.task);
    this.dates = combined.map(x => x.date);
    this.status = combined.map(x => x.status);
  },

  filterTasks() {
  const term = this.term.value.trim();
  const ul = document.getElementById('list');
  const items = ul.querySelectorAll('li');

  items.forEach((li, i) => {
    const original = this.tasks[i];
    const p = li.querySelector('p');

    if (term.length >= 2) {
      const hit = original.toLowerCase().includes(term.toLowerCase());
      li.style.display = hit ? '' : 'none';
      p.innerHTML = hit ? this.highlight(original, term) : original; // podświetlenie tylko dla trafień
    } else {
      li.style.display = '';
      p.textContent = original; // wróć do zwykłego tekstu, bez mark
    }
  });
},


  highlight(text, filter) {
    return text.replace(new RegExp(filter, 'gi'), match => `<mark>${match}</mark>`);
  }
};

// Obsługa Entera
['add', 'addDate'].forEach(id =>
  document.getElementById(id).addEventListener('keydown', e => {
    if (e.key === 'Enter') Todo.addTask();
  })
);


// Natychmiastowe wyszukiwanie w czasie pisania
Todo.term.addEventListener('input', () => {
  if (Todo.term.value.trim().length >= 2) {
    Todo.filterTasks();
  } else {
    Todo.draw();
  }
});

// Odświeżenie widoku przy starcie
Todo.draw();
