// This device's optional practice preferences are independent of student accounts and journals.
import {catalog} from './content.mjs';
import {languages, shiftDate, weekStart} from './state.mjs';

const storageKey = 'restart.device.practice-plan.v1';
const themes = {
  varied: catalog.map(item => item.id),
  movement: ['yoga', 'mobility', 'strength'],
  attention: ['meditation', 'breathing'],
  unwind: ['recovery', 'breathing', 'meditation']
};
const budgets = [...new Set(catalog.map(item => item.minutes))].sort((a, b) => a - b);
const frequency = [1, 2, 3, 4, 5, 6, 7];
const defaults = {theme: 'varied', minutes: 5, count: 3};
const labels = {
  title: ['Мой план на неделю', 'Həftəlik məşq planım', 'My weekly practice plan'],
  local: ['Выберите ритм занятий для этого устройства. План повторяется каждую неделю.', 'Bu cihaz üçün məşq ritmini seçin. Plan hər həftə təkrarlanır.', 'Choose a practice rhythm for this device. Your plan repeats each week.'],
  theme: ['Направление', 'İstiqamət', 'Focus'],
  varied: ['Разные практики', 'Müxtəlif məşqlər', 'A mix of practices'],
  movement: ['Движение', 'Hərəkət', 'Movement'],
  attention: ['Внимание', 'Diqqət', 'Attention'],
  unwind: ['Расслабление', 'Rahatlama', 'Relaxation'],
  minutes: ['Время на одно занятие', 'Bir məşq üçün vaxt', 'Time per practice'],
  min: ['мин', 'dəq', 'min'],
  frequency: ['Занятий в неделю', 'Həftədə məşq sayı', 'Practices per week'],
  save: ['Сохранить план', 'Planı yadda saxla', 'Save plan'],
  clear: ['Удалить план с устройства', 'Planı cihazdan sil', 'Remove plan from device'],
  saved: ['План сохранён на этом устройстве.', 'Plan bu cihazda yadda saxlanıldı.', 'Your plan is saved on this device.'],
  removed: ['План удалён с этого устройства.', 'Plan bu cihazdan silindi.', 'Your plan has been removed from this device.'],
  memory: ['Браузер ограничил доступ к памяти. Изменение действует в этой вкладке.', 'Brauzer yaddaşa girişi məhdudlaşdırıb. Dəyişiklik bu vərəqdə qüvvədədir.', 'Browser storage is unavailable. This change applies in this tab.'],
  noMatch: ['Для выбранного направления пока нет занятия такой длительности. Увеличьте время или выберите другое направление.', 'Seçilmiş istiqamət üzrə bu müddətə uyğun məşq hələ yoxdur. Vaxtı artırın və ya başqa istiqamət seçin.', 'There is no practice in this focus within that time. Allow more time or choose another focus.'],
  invalid: ['Проверьте параметры плана.', 'Planın seçimlərini yoxlayın.', 'Check your plan selections.']
};

function preferences(value) {
  if (!value || !Object.hasOwn(themes, value.theme) || !budgets.includes(value.minutes) || !frequency.includes(value.count)) return null;
  return {theme: value.theme, minutes: value.minutes, count: value.count};
}

export function practicePlanStore(getStorage = () => globalThis.localStorage) {
  let memory = null;
  let available = true;
  return {
    read() {
      if (available) {
        try {
          const raw = getStorage().getItem(storageKey);
          if (raw === null) return null;
          try { return preferences(JSON.parse(raw)); } catch { return null; }
        } catch { available = false; }
      }
      return memory;
    },
    write(value) {
      const clean = preferences(value);
      if (value !== null && !clean) throw new RangeError('invalid practice preferences');
      memory = clean;
      try {
        if (clean) getStorage().setItem(storageKey, JSON.stringify(clean));
        else getStorage().removeItem(storageKey);
        available = true;
      } catch { available = false; }
      return available;
    }
  };
}
const device = practicePlanStore();

export function weeklyPractices(value, today = new Date()) {
  const prefs = preferences(value);
  if (!prefs) return [];
  const pool = themes[prefs.theme].map(id => catalog.find(item => item.id === id))
    .filter(item => item && item.minutes <= prefs.minutes);
  if (!pool.length) return [];
  const monday = weekStart(today);
  return Array.from({length: prefs.count}, (_, i) => ({
    date: shiftDate(monday, Math.floor(i * 7 / prefs.count)),
    item: pool[i % pool.length]
  }));
}

export function suggestedPracticeId(today = new Date(), store = device) {
  return weeklyPractices(store.read(), today).find(row => row.date.getDay() === today.getDay())?.item.id ?? null;
}

export function renderPersonalPlan(lang, store = device, notice = '', today = new Date()) {
  const index = Math.max(0, languages.indexOf(lang));
  const t = id => labels[id][index];
  const saved = store.read();
  const value = saved ?? defaults;
  const options = (values, selected, caption) => values.map(v =>
    `<option value="${v}"${selected === v ? ' selected' : ''}>${caption(v)}</option>`).join('');
  const calendar = new Intl.DateTimeFormat(languages[index], {weekday: 'long', month: 'short', day: 'numeric'});
  const rows = weeklyPractices(value, today);
  const schedule = rows.map(({date, item}) =>
    `<li><span>${calendar.format(date)}</span> · <a href="#practice/${item.id}">${item.title[index]}</a> · ${item.minutes} ${t('min')}</li>`).join('');
  return `<section class="panel personal-plan" data-personal-plan aria-labelledby="device-plan-title">
    <h2 id="device-plan-title" tabindex="-1">${t('title')}</h2><p>${t('local')}</p>
    <form id="personal-plan-form">
      <label>${t('theme')}<select name="theme">${options(Object.keys(themes), value.theme, t)}</select></label>
      <label>${t('minutes')}<select name="minutes">${options(budgets, value.minutes, v => v+' '+t('min'))}</select></label>
      <label>${t('frequency')}<select name="count">${options(frequency, value.count, String)}</select></label>
      <div class="actions"><button class="cta" type="submit">${t('save')}</button>${saved ? `<button type="submit" name="remove" value="1">${t('clear')}</button>` : ''}</div>
    </form>
    <p role="status" tabindex="-1">${notice && Object.hasOwn(labels, notice) ? t(notice) : ''}</p>
    ${saved ? `<ul class="history">${schedule}</ul>` : ''}
  </section>`;
}

export function submitPersonalPlan(form, lang, button, store = device) {
  const removing = button?.name === 'remove';
  const data = new FormData(form);
  const value = preferences({theme: data.get('theme'), minutes: Number(data.get('minutes')), count: Number(data.get('count'))});
  const panel = form.closest('[data-personal-plan]');
  const index = Math.max(0, languages.indexOf(lang));
  if (!removing && (!value || !weeklyPractices(value).length)) {
    const status = panel.querySelector('[role="status"]');
    status.textContent = labels[value ? 'noMatch' : 'invalid'][index];
    status.focus({preventScroll: true});
    return;
  }
  const stored = store.write(removing ? null : value);
  const template = document.createElement('template');
  template.innerHTML = renderPersonalPlan(lang, store, stored ? (removing ? 'removed' : 'saved') : 'memory');
  const next = template.content.firstElementChild;
  panel.replaceWith(next);
  next.querySelector('[role="status"]').focus({preventScroll: true});
}
