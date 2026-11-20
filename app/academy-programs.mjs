// Keys used by programme metadata and its owner editor in the school workspace.
export const academyCopy = {
 courseDetails: ['Карточка программы','Proqram haqqında','Programme details'],
 courseSummary: ['Краткое описание','Qısa təsvir','Summary'],
 courseDirection: ['Направление','İstiqamət','Direction'],
 courseLevel: ['Уровень','Səviyyə','Level'],
 courseMinutes: ['Длительность в минутах','Müddət (dəqiqə)','Duration in minutes'],
 courseMinuteUnit: ['мин','dəq','min'],
 courseUnspecified: ['Не указано','Göstərilməyib','Unspecified'],
 courseBeginner: ['Начальный','Başlanğıc','Beginner'],
 courseIntermediate: ['Средний','Orta','Intermediate'],
 courseAdvanced: ['Продвинутый','Yüksək','Advanced'],
 courseAll: ['Для всех уровней','Bütün səviyyələr üçün','All levels'],
 courseConflict: ['Программа изменилась. Обновите страницу перед сохранением.','Proqram dəyişib. Yadda saxlamazdan əvvəl səhifəni yeniləyin.','The programme has changed. Refresh before saving.']
};

const directions = ['mind','body','nutrition','life'];
const levels = {beginner:'courseBeginner',intermediate:'courseIntermediate',advanced:'courseAdvanced',all:'courseAll'};

export function programmeCardInfo(program,t,esc) {
 const tags = [];
 if (directions.includes(program.direction)) tags.push(program.direction.toUpperCase());
 if (Object.hasOwn(levels,program.level)) tags.push(t(levels[program.level]));
 if (program.minutes) tags.push(esc(program.minutes)+' '+t('courseMinuteUnit'));
 return (tags.length ? '<p class="muted">'+tags.join(' · ')+'</p>' : '')+
   (program.summary ? '<p>'+esc(program.summary)+'</p>' : '');
}

function choice(name, caption, options, selected) {
 return '<label>'+caption+'<select name="'+name+'">'+options.map(([value,label])=>
   '<option value="'+value+'"'+(value===selected?' selected':'')+'>'+label+'</option>').join('')+'</select></label>';
}

export function programmeEditor(program,t,esc) {
 const blank = ['',t('courseUnspecified')];
 return '<details class="panel"><summary>'+t('courseDetails')+'</summary>'+
   '<form data-school="courseDetails" data-key="'+esc(program.id)+'">'+
   '<input type="hidden" name="revision" value="'+esc(program.revision)+'">'+
   '<label>'+t('schoolTitle')+'<input name="title" required maxlength="180" value="'+esc(program.title)+'"></label>'+
   '<label>'+t('courseSummary')+'<textarea name="summary" maxlength="1600">'+esc(program.summary)+'</textarea></label>'+
   choice('direction',t('courseDirection'),[blank,...directions.map(d=>[d,d.toUpperCase()])],program.direction)+
   choice('level',t('courseLevel'),[blank,...Object.entries(levels).map(([k,v])=>[k,t(v)])],program.level)+
   '<label>'+t('courseMinutes')+'<input name="minutes" type="number" min="1" max="10080" step="1" value="'+esc(program.minutes)+'"></label>'+
   '<button>'+t('save')+'</button></form></details>';
}

export async function saveProgrammeDetails(client,id,fields) {
 const minutes = fields.minutes ? Number(fields.minutes) : null;
 const revision = Number(fields.revision);
 if (!fields.title?.trim() || !Number.isSafeInteger(revision) || revision < 1 ||
     (minutes !== null && (!Number.isInteger(minutes) || minutes<1 || minutes>10080))) {
  throw new Error('Invalid programme details');
 }
 const changes = {title:fields.title.trim(), summary:fields.summary.trim(),
   direction:fields.direction || null, level:fields.level || null, minutes};
 const {data,error} = await client.from('restart_programs').update(changes)
   .eq('id',id).eq('revision',revision).select('id').maybeSingle();
 if (error) throw error;
 if (!data) throw new Error('courseConflict');
}
