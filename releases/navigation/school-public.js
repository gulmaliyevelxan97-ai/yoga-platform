'use strict';

const code=[
 ['Познай себя, прежде чем менять себя.','Özünü dəyişməzdən əvvəl özünü tanı.','Know yourself before changing yourself.'],
 ['Начинай каждый день с умом начинающего.','Hər günə yeni başlayan düşüncəsi ilə başla.','Begin each day with a beginner’s mind.'],
 ['Развивай силу без насилия.','Gücünü zorakılıq etmədən inkişaf etdir.','Develop strength without violence.'],
 ['Будь предан практике, но свободен от результата.','Məşqə sadiq qal, nəticəyə bağlanma.','Stay committed to practice without clinging to results.'],
 ['Превращай движение в осознанное действие.','Hərəkəti şüurlu bir əmələ çevir.','Turn movement into deliberate action.'],
 ['Сохраняй внимание после действия.','Hərəkətdən sonra da diqqətini saxla.','Sustain attention after the action.'],
 ['Уважай паузу так же, как усилие.','Fasiləyə də səy qədər dəyər ver.','Respect the pause as much as the effort.'],
 ['Совершенствуйся небольшими шагами.','Kiçik addımlarla irəlilə.','Improve in small steps.'],
 ['Иди своим путём, уважая путь других.','Öz yolunla get, başqalarının yoluna hörmət et.','Follow your own path while respecting others.'],
 ['Превращай знания в образ жизни.','Öyrəndiklərini həyat tərzinə çevir.','Bring what you learn into daily life.']
];

const pathway=[
 ['Пробуждение','Oyanış','Awakening'],['Освобождение','Azadlaşma','Letting go'],['Основание','Təməl','Foundation'],['Дисциплина','İntizam','Discipline'],['Равновесие','Tarazlıq','Balance'],['Преодоление','Çətinlikləri aşmaq','Overcoming obstacles'],['Интеграция','Bütövləşdirmə','Integration'],['Новое начало','Yeni başlanğıc','A new beginning']];
function schoolPage(route){
 if(route==='code')return '<ol>'+code.map(rule=>'<li>'+t(...rule)+'</li>').join('')+'</ol>';
 return '<p>'+t('Записи доступны на этом устройстве в текущем браузере.','Qeydlər bu cihazın cari brauzerində saxlanılır.','Notes are stored in this browser on this device.')+'</p>'+weekdays.map((day,i)=>'<details class="card"><summary>'+t(...day)+'</summary>'+field('diary'+i,t('Заметки','Qeydlər','Notes'))+field('habit'+i,t('Привычки','Vərdişlər','Habits'))+field('move'+i,t('Движение','Hərəkət','Movement'))+'</details>').join('');
}

const notesKey='restart.awakening.evidence.v2';
function notes(){try{return JSON.parse(read(notesKey))||{}}catch{return {}}}
function field(key,label){return '<label class="label">'+label+'<textarea maxlength="1600" data-note="'+key+'"></textarea></label>'}
function hydrateFields(){
 const data=notes();
 document.querySelectorAll('[data-note]').forEach(el=>el.value=data[el.dataset.note]||'');
}
document.addEventListener('input',event=>{
 const key=event.target.dataset.note;
 if(!key)return;
 try{localStorage.setItem(notesKey,JSON.stringify({...notes(),[key]:event.target.value}))}
 catch{document.querySelector('#notice').textContent=t('Не удалось сохранить запись.','Qeydi saxlamaq mümkün olmadı.','Could not save the note.')}
});
