import {categories, strings} from './content.mjs';
import {languages} from './state.mjs';

const copy = {
 title:['Добро пожаловать в RESTART','RESTART-a xoş gəlmisən','Welcome to RESTART'],
 path:[
  'Твой путь к силе тела, ясности разума и внутренней гармонии начинается здесь.',
  'Bədən gücünə, zehin aydınlığına və daxili harmoniyaya gedən yolun burada başlayır.',
  'Your path to a strong body, a clear mind and inner harmony starts here.'
 ],
 access:['Ранний доступ','Erkən giriş','Early access'],
 voluntary:[
  'Участие добровольное. Ты можешь выбрать любую практику и остановиться в любой момент.',
  'İştirak könüllüdür. İstədiyin məşqi seçə və istənilən vaxt dayana bilərsən.',
  'Taking part is voluntary. Choose any practice and stop whenever you like.'
 ],
 privacy:[
  'В гостевом режиме записи и прогресс хранятся только в браузере на этом устройстве. Облачная синхронизация в гостевом режиме недоступна. Очистка данных браузера удалит их. Не добавляй в дневник чувствительные личные сведения.',
  'Qonaq rejimində qeydlər və irəliləyiş yalnız bu cihazdakı brauzerdə saxlanılır. Qonaq rejimində bulud sinxronizasiyası mövcud deyil. Brauzer məlumatlarını təmizləsən, onlar silinəcək. Gündəliyə həssas şəxsi məlumat yazma.',
  'In guest mode, entries and progress stay in this device’s browser. Guest mode has no cloud sync. Clearing browser data erases them. Keep sensitive personal information out of the journal.'
 ],
 week:['Программа недели','Həftənin proqramı','Weekly programme']
};

const localeIndex = lang => Math.max(0, languages.indexOf(lang));

export function retreatWelcomeTitle(lang) {
 return copy.title[localeIndex(lang)];
}

export function renderRetreatWelcome(lang) {
 const index = localeIndex(lang);
 const routes = [
  ['#practice/breathing',categories.breathing],
  ['#practice/meditation',categories.meditation],
  ['#journal',strings.journal],
  ['#week',copy.week]
 ];
 return `<section class="panel retreat-welcome" aria-labelledby="retreat-welcome-title">
 <p class="retreat-welcome-lead">${copy.path[index]}</p>
 <h2 id="retreat-welcome-title">${copy.access[index]}</h2>
 <p>${copy.voluntary[index]}</p>
 <p class="muted">${copy.privacy[index]}</p>
 <div class="retreat-shortcuts">${routes.map(([href,labels])=>`<a class="button" href="${href}">${labels[index]}</a>`).join('')}</div>
 </section>`;
}
