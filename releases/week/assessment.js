'use strict';
const stages=[
 ['Наблюдение','Müşahidə','Observation'],['Понимание','Anlama','Understanding'],['Действие','Hərəkət','Action'],['Закрепление','Möhkəmləndirmə','Consolidation'],['Интеграция','Bütövləşdirmə','Integration']];
const dayStages=[0,1,2,1,3,0,4];
const stagePrompts=[
 ['Что произошло? Назовите один видимый или ощутимый факт.','Nə baş verdi? Gördüyünüz və ya hiss etdiyiniz bir faktı adlandırın.','What happened? Describe one observable detail.'],
 ['Как условия повлияли на выбор? Проверьте своё объяснение во второй попытке.','Şərait seçiminizə necə təsir etdi? Fikrinizi ikinci cəhddə yoxlayın.','How did the situation shape your choice? Test your explanation on a second attempt.'],
 ['Измените одну деталь, сохранив остальные условия.','Digər şərtləri saxlayaraq bir detalı dəyişin.','Change one detail while keeping the rest steady.'],
 ['Повторите выбранный вариант и назовите подсказку, которая помогла.','Seçdiyiniz variantı təkrarlayın və kömək edən ipucunu adlandırın.','Repeat your chosen version and identify the cue that helped.'],
 ['Где в обычной жизни вы применили тот же навык?','Gündəlik həyatda həmin bacarığı harada tətbiq etdiniz?','Where in everyday life did you use the same skill?']];
const domainSkills=[
 ['Замечаю отвлечение и возвращаюсь к выбранному объекту внимания.','Fikrimin yayındığını sezib diqqətimi seçdiyim obyektə qaytarıram.','I notice distraction and return to my chosen focus.'],
 ['Выбираю опору или амплитуду, при которой движение остаётся управляемым.','Hərəkəti idarə edə bildiyim dayaq və ya amplitudanı seçirəm.','I choose support or range that lets me control the movement.'],
 ['Различаю ощущение голода и внешнее обстоятельство, влияющее на выбор еды.','Aclıq hissini yemək seçimimə təsir edən xarici şəraitdən ayıra bilirəm.','I distinguish hunger cues from circumstances that shape my food choices.'],
 ['Связываю небольшое действие с конкретным моментом дня.','Kiçik bir hərəkəti günün konkret məqamı ilə əlaqələndirirəm.','I link a small action to a specific moment in my day.']];
const levels=[['Пока не наблюдал','Hələ müşahidə etməmişəm','Not yet observed'],['С подсказкой','İpucu ilə','With a cue'],['Самостоятельно','Müstəqil','Independently'],['В другой ситуации','Başqa şəraitdə','In another setting']];
const notesKey='restart.awakening.evidence.v2';
function notes(){try{return JSON.parse(read(notesKey))||{}}catch{return {}}}
const field=(key,label)=>'<label class="label">'+label+'<textarea maxlength="1600" data-note="'+key+'"></textarea></label>';
function scale(period){
 return '<div class="cards">'+domainSkills.map((v,k)=>'<article><label>'+tracks[k]+' · '+t(...v)+'<select data-note="'+period+k+'"><option value="">—</option>'+levels.map((l,n)=>'<option value="'+n+'">'+t(...l)+'</option>').join('')+'</select></label></article>').join('')+'</div>';
}
function dayNotes(i){
 let base=i===0?'<h3>'+t('Моя исходная точка','Başlanğıc səviyyəm','My starting point')+'</h3>'+scale('before'):'';
 let prompt=t(...stagePrompts[dayStages[i]]);
 return '<article class="week-note">'+base+'<h3>'+t('Дневник наблюдений','Müşahidə gündəliyi','Observation journal')+'</h3>'+field('diary'+i,prompt)+field('habit'+i,t('Какой сигнал напомнил о привычке? Что вы сделали после него?','Hansı işarə vərdişi yadınıza saldı? Sonra nə etdiniz?','What reminded you of the habit? What did you do next?'))+(i===0||i===6?field('move'+i,t('Двигательное наблюдение: укажите движение, опору, темп и ощущение контроля.','Hərəkət müşahidəsi: hərəkəti, dayağı, tempi və nəzarət hissini qeyd edin.','Movement observation: record the movement, support, pace and sense of control.')):'')+'</article>';
}
function taskCard(task,i,k){
 const [name,goal,how,why,criterion]=task[lang];
 return '<article class="task"><small>'+tracks[k]+' · '+task.min+' '+t('мин','dəq','min')+'</small><h3>'+name+'</h3><p>'+goal+'</p><p>'+how+'</p><details><summary>'+t('Зачем это делать','Nə üçün edirik','Why practise this?')+'</summary>'+why+'</details><p class="band">'+criterion+'</p><label><input type="checkbox" data-task="'+id(i,k)+'" '+(done[id(i,k)]?'checked':'')+'> '+t('Выполнено','Tamamlandı','Completed')+'</label></article>';
}
function sessionPlan(i){
 const plan=window.lessonPlans[i+1];
 if(!plan)return '';
 return '<article><details><summary>'+t('Очная практика · 90 минут · план преподавателя','Əyani məşğələ · 90 dəqiqə · müəllim üçün plan','In-person practice · 90 minutes · instructor plan')+'</summary><ol>'+plan.map(p=>'<li><b>'+p.min+' '+t('мин','dəq','min')+'</b> · '+p[lang]+'</li>').join('')+'</ol></details></article>';
}
function method(){
 return '<h2>'+t('Метод RESTART','RESTART metodu','The RESTART method')+'</h2><p>'+t('ВХОД · Присутствие. ПУТЬ · Осознанное усилие. ВЫХОД · Интеграция.','GİRİŞ · Hazır olmaq. YOL · Şüurlu səy. ÇIXIŞ · Bütövləşdirmə.','ENTRY · Presence. PATH · Deliberate effort. EXIT · Integration.')+'</p>'+stages.map((s,i)=>'<article><h3>'+t(...s)+'</h3><p>'+t(...stagePrompts[i])+'</p></article>').join('')+'<h2>'+t('Четыре навыка недели','Həftənin dörd bacarığı','Four skills for the week')+'</h2>'+domainSkills.map((s,i)=>'<p><b>'+tracks[i]+'</b> · '+t(...s)+'</p>').join('')+'<h2>'+t('Традиции и практика школы','Ənənələr və məktəbin təcrübəsi','Traditions and school practice')+'</h2>'+window.schoolConcepts.map(([term,...words])=>'<details class="card"><summary>'+term+'</summary><p>'+t(...words)+'</p></details>').join('')+go('day-1',t('К исходной оценке','İlkin qiymətləndirməyə keç','Open baseline assessment'));
}
function skillsReport(){
 return '<h2>'+t('Что я научился делать','Nə etməyi öyrəndim','What I learned to do')+'</h2><p>'+t('Сравните свой выбор с первым днём. Для каждого навыка укажите, когда вам понадобилась подсказка.','Seçiminizi ilk günlə müqayisə edin. Hər bacarıq üçün ipucuna nə vaxt ehtiyac duyduğunuzu qeyd edin.','Compare your choices with day one. For each skill, recall when you needed a cue.')+'</p>'+go('day-1',t('Исходная самооценка','İlkin özünüqiymətləndirmə','Baseline self-assessment'))+scale('after')+'<div id="feedback"></div>'+field('reflection',t('Опишите один конкретный эпизод недели. Что вы сохраните или упростите?','Həftədən bir konkret hadisəni təsvir edin. Nəyi saxlayacaq və ya sadələşdirəcəksiniz?','Describe one episode from this week. What will you keep or simplify?'))+'<details><summary>'+t('Мои записи за неделю','Həftəlik qeydlərim','My weekly notes')+'</summary><div id="entries"></div></details>';
}
function feedback(){
 const box=document.querySelector('#feedback');if(!box)return;
 const data=notes();
 box.replaceChildren();
 tracks.forEach((name,i)=>{
 const a=data['before'+i],b=data['after'+i];if(!b&&!a)return;
 const result=document.createElement('p');const label=x=>levels[x]?t(...levels[x]):'—';
 result.textContent=name+' · '+label(a)+' → '+label(b)+'. '+(!b?t('Добавьте итоговую оценку.','Yekun qiyməti əlavə edin.','Add your end-of-week assessment.'):Number(b)<2?t('Повторите этот навык в знакомых условиях с одной подсказкой.','Bu bacarığı tanış şəraitdə bir ipucu ilə təkrarlayın.','Repeat this skill in a familiar setting with one cue.'):t('Выберите другую бытовую ситуацию и проверьте, удастся ли повторить навык.','Başqa bir gündəlik vəziyyət seçib bacarığı təkrar yoxlayın.','Choose a different everyday situation and test whether you can repeat the skill.'));box.append(result);
 });
 const entries=document.querySelector('#entries');entries.replaceChildren();
 weekdays.forEach((d,i)=>{const v=['diary','habit','move'].map(k=>data[k+i]).filter(Boolean);if(v.length){const p=document.createElement('p');p.textContent=t(...d)+' · '+v.join(' · ');entries.append(p)}});
}
function hydrateFields(){const data=notes();document.querySelectorAll('[data-note]').forEach(el=>el.value=data[el.dataset.note]||'');feedback()}
document.addEventListener('input',e=>{const key=e.target.dataset.note;if(!key)return;try{localStorage.setItem(notesKey,JSON.stringify({...notes(),[key]:e.target.value}));feedback()}catch{document.querySelector('#notice').textContent=t('Не удалось сохранить запись.','Qeydi saxlamaq mümkün olmadı.','Could not save this entry.')}});
