'use strict';

const restartStory = {
  title:['История и миссия RESTART','RESTART-ın yaranması və missiyası','The story and mission of RESTART'],
  tagline:['Сила тела. Гармония сознания.','Bədənin gücü. Şüurun harmoniyası.','Strength of body. Harmony of mind.'],
  paragraphs:[
   ['RESTART родился из стремления объединить два важнейших аспекта человеческого развития — физическую силу и внутреннюю гармонию.',
    'RESTART insan inkişafının iki mühüm tərəfini — fiziki gücü və daxili harmoniyanı — birləşdirmək istəyindən yarandı.',
    'RESTART grew out of a desire to bring together two essential aspects of human development: physical strength and inner harmony.'],
   ['Идея создания школы заключалась не просто в том, чтобы помогать людям становиться сильнее, выносливее и увереннее в собственном теле. Не менее важной целью было научить их находить внутреннее равновесие, осознанность и гармонию с собой через йогу и медитацию.',
    'Məktəbin məqsədi insanlara daha güclü, dözümlü və öz bədənlərində daha inamlı olmağa kömək etmək idi. Digər, eyni dərəcədə vacib məqsəd yoqa və meditasiya vasitəsilə daxili tarazlığı, fərqindəliyi və özü ilə harmoniyanı tapmağı öyrətmək idi.',
    'The school was founded to help people become stronger, build endurance and feel more confident in their bodies. An equally important aim was to teach them to find inner balance, awareness and harmony with themselves through yoga and meditation.'],
   ['В основе философии RESTART лежит убеждение, что физическое и внутреннее развитие не должны существовать отдельно друг от друга.',
    'RESTART fəlsəfəsinin əsasında fiziki və daxili inkişafın bir-birini tamamladığına inam dayanır.',
    'At the heart of RESTART is the belief that physical and inner development belong together.'],
   ['Сила без внутреннего равновесия может потерять своё направление. А внутренняя гармония становится глубже, когда человек учится понимать своё тело, управлять движением, дыханием и вниманием.',
    'Daxili tarazlıq olmadıqda güc öz istiqamətini itirə bilər. İnsan bədənini anlamağı, hərəkətini, nəfəsini və diqqətini idarə etməyi öyrəndikcə daxili harmoniya dərinləşir.',
    'Strength can lose its direction without inner balance. Inner harmony deepens as we learn to understand our bodies and guide our movement, breathing and attention.'],
   ['RESTART — это пространство, где дисциплина встречается с осознанностью, движение — с тишиной, а физическое совершенствование — с внутренним раскрытием.',
    'RESTART intizamın fərqindəliklə, hərəkətin sükutla, fiziki inkişafın isə özünü kəşflə qovuşduğu bir məkandır.',
    'RESTART is a space where discipline meets awareness, movement meets stillness, and physical development meets self-discovery.'],
   ['Здесь нет необходимости становиться кем-то другим. Важно научиться лучше понимать себя, раскрывать собственные возможности и находить баланс между силой и спокойствием.',
    'Burada başqa birinə çevrilməyə ehtiyac yoxdur. Əsas olan özünü daha yaxşı anlamağı, imkanlarını üzə çıxarmağı və güclə sakitlik arasında tarazlıq tapmağı öyrənməkdir.',
    'Here, there is no need to become someone else. What matters is learning to understand yourself better, discover what you are capable of, and find a balance between strength and calm.']
  ],
  motto:['Не стать другим. Раскрыть себя.','Başqa biri olma. Özünü kəşf et.','Become more fully yourself.']
 };

const aboutDirections = [
 {mark:'◎', lead:[
  'Осознанность начинается с простого различия. Одно дело — то, что мы заметили. Другое — смысл, который мы сразу этому приписали.',
  'Fərqindəlik sadə bir fərqi görməkdən başlayır. Sezdiyimiz bir şeydir, ona dərhal verdiyimiz məna isə başqa.',
  'Awareness begins with a simple distinction. What we notice and what we immediately make of it are two different things.'
 ], sections:[
  {title:['Что удерживает внимание','Diqqəti nə cəlb edir','What holds our attention'], text:[
   'Когда дел много или разговор становится напряжённым, внимание легко захватывает самое срочное. В этот момент полезно различить ощущение, чувство и вывод. Сжатая челюсть может подсказать, что мы напряжены. Раздражение говорит о том, как мы переживаем ситуацию. Ни то ни другое само по себе не объясняет намерений собеседника.',
   'İşlər çoxalanda və ya söhbət gərginləşəndə diqqətimiz ən təcili görünən məsələyə yönəlir. Belə anda bədən duyğusunu, hissi və çıxardığımız nəticəni ayırmaq faydalıdır. Çənənin sıxılması gərgin olduğumuzu göstərə bilər. Qıcıq isə vəziyyəti necə yaşadığımızdan xəbər verir. Bunların heç biri qarşı tərəfin niyyətini öz-özlüyündə izah etmir.',
   'When tasks pile up or a conversation gets tense, whatever feels urgent can take over our attention. It helps to distinguish a sensation, a feeling and a conclusion. A tight jaw may tell us we are tense. Irritation tells us how the situation feels. Neither alone tells us what the other person intended.'
  ]},
  {title:['Пауза в обычном разговоре','Gündəlik söhbətdə fasilə','A pause in an everyday conversation'], text:[
   'Если короткое сообщение кажется резким, можно уточнить, что имел в виду собеседник, прежде чем отвечать на предполагаемый упрёк. Иногда тело первым подсказывает, что стоит притормозить. В BODY мы учимся замечать такие сигналы, а LIFE помогает соотнести ответ с тем, как мы хотим обращаться с людьми.',
   'Qısa mesaj sərt səslənirsə, onu irad kimi qəbul edib cavab verməzdən əvvəl qarşı tərəfin nə demək istədiyini soruşa bilərik. Bəzən bir az dayanmağın lazım olduğunu ilk olaraq bədənimiz hiss etdirir. BODY bu siqnalları sezməyə, LIFE isə cavabımızı insanlarla necə davranmaq istədiyimizə uyğun seçməyə kömək edir.',
   'If a short message sounds sharp, we can ask what was meant before responding to what we took as criticism. Sometimes the body is the first to suggest slowing down. BODY helps us notice those signals, while LIFE asks whether our response reflects how we want to treat people.'
  ]}
 ], close:[
  'Внутренняя свобода иногда умещается в один момент между первой реакцией и выбранным ответом.',
  'Daxili azadlıq bəzən ilk reaksiyamızla seçdiyimiz cavab arasındakı bir ana sığır.',
  'Sometimes inner freedom fits into the moment between our first reaction and the response we choose.'
 ]},
 {mark:'◈', lead:[
  'Сила проявляется и в том, сколько усилия мы способны приложить, и в том, насколько точно умеем им распорядиться.',
  'Güc həm nə qədər səy göstərə bildiyimizdə, həm də bu səyi nə qədər dəqiq yönəltdiyimizdə üzə çıxır.',
  'Strength shows in how much effort we can bring to a movement and how precisely we can direct it.'
 ], sections:[
  {title:['Что делает движение управляемым','Hərəkəti nə idarəolunan edir','What makes movement controllable'], text:[
   'В йоге или тренировке одна и та же поза может ощущаться по-разному в зависимости от темпа, опоры и усталости. Гибкость даёт диапазон, сила помогает действовать в нём, а координация связывает отдельные движения. Когда контроль теряется, меньшая амплитуда или более прочная опора могут сделать задачу посильнее.',
   'Yoqada və ya məşqdə eyni duruş tempə, dayağa və yorğunluğa görə fərqli hiss oluna bilər. Çeviklik hərəkət üçün genişlik yaradır, güc bu genişlikdə hərəkət etməyə kömək edir, koordinasiya isə ayrı-ayrı hərəkətləri birləşdirir. Nəzarət azalanda hərəkəti kiçiltmək və ya daha sabit dayaq seçmək işi asanlaşdıra bilər.',
   'In yoga or training, the same position can feel different depending on pace, support and fatigue. Flexibility gives us range, strength helps us act within it, and coordination links individual movements. When control begins to slip, a smaller range or steadier support can make the movement more manageable.'
  ]},
  {title:['Сила в повседневном движении','Gündəlik hərəkətdə güc','Strength in ordinary movement'], text:[
   'Спускаясь по лестнице с сумкой, мы решаем знакомую задачу: удержать равновесие и распределить усилие, когда одна рука занята. MIND помогает обратить внимание на качество движения, а LIFE напоминает, что восстановление тоже занимает место в распорядке.',
   'Əlimizdə çanta ilə pilləkən düşəndə tanış bir iş görürük: bir əlimiz dolu olduğu halda tarazlığı saxlayır və gücümüzü bölüşdürürük. MIND hərəkətin keyfiyyətinə diqqət yetirməyə kömək edir, LIFE isə bərpaya da gündəlik rejimdə yer ayırmağı xatırladır.',
   'Walking downstairs with a bag is a familiar challenge: we keep our balance and distribute effort while one hand is occupied. MIND draws attention to the quality of movement, and LIFE reminds us to make room for recovery in our routine.'
  ]}
 ], close:[
  'Хороший признак силы — возможность осознанно выбрать, когда добавить усилие, а когда его уменьшить.',
  'Gücün bir göstəricisi səyi nə vaxt artırıb, nə vaxt azaltmağı şüurlu şəkildə seçə bilməkdir.',
  'One sign of strength is being able to choose when to add effort and when to ease it.'
 ]},
 {mark:'❧', lead:[
  'Питание начинается с внимания к тому, как мы живём. Еда связана с голодом и вкусом, распорядком дня, культурой и общением.',
  'Qidalanma necə yaşadığımıza diqqət yetirməkdən başlayır. Yemək aclıq və dadla yanaşı, günün rejimi, mədəniyyət və ünsiyyətlə də bağlıdır.',
  'Nutrition starts with paying attention to how we live. Food has to do with hunger and taste, but also with schedules, culture and company.'
 ], sections:[
  {title:['Что влияет на выбор еды','Yemək seçiminə nə təsir edir','What shapes food choices'], text:[
   'Мы едим в разных обстоятельствах. После долгого дня или в спешке решающим может стать то, что есть под рукой. У одной и той же привычки бывает несколько причин, поэтому полезно замечать и сигналы тела, и условия вокруг. Это даёт больше информации, чем оценка себя за каждый приём пищи.',
   'Yeməyi müxtəlif şəraitdə yeyirik. Uzun gündən sonra və ya tələsəndə seçimimizi əlimizin altında olan yemək müəyyən edə bilər. Eyni vərdişin bir neçə səbəbi ola bilər. Ona görə həm bədənin siqnallarına, həm də ətrafdakı şəraitə diqqət yetirmək hər dəfə özümüzü mühakimə etməkdən daha çox məlumat verir.',
   'We eat under different circumstances. After a long day or in a hurry, what is within reach may decide the meal. A single habit can have several causes. Noticing both bodily signals and the circumstances around us tells us more than judging ourselves meal by meal.'
  ]},
  {title:['Привычка, которая вписывается в жизнь','Həyata uyğun gələn vərdiş','A habit that fits your life'], text:[
   'Если обед часто сдвигается из-за работы, дело может быть в расписании и доступных вариантах. MIND помогает заметить этот повтор, LIFE — предусмотреть время и выбор, а BODY — обратить внимание на то, как самочувствие меняется в разные дни.',
   'Nahar işə görə tez-tez gecikirsə, səbəb iş rejimi və əlçatan seçimlər ola bilər. MIND bu təkrarı sezməyə, LIFE qabaqcadan vaxt və seçim ayırmağa, BODY isə müxtəlif günlərdə özümüzü necə hiss etdiyimizə diqqət verməyə kömək edir.',
   'If work keeps pushing lunch back, timing and available options may be part of the reason. MIND helps us notice the pattern, LIFE helps us make room for a meal, and BODY brings attention to how we feel on different days.'
  ]}
 ], close:[
  'Хорошая привычка оставляет достаточно гибкости для дня, который пошёл иначе.',
  'Yaxşı vərdiş planın dəyişdiyi günlər üçün də kifayət qədər çeviklik saxlayır.',
  'A good habit leaves enough room for a day that goes differently.'
 ]},
 {mark:'☀', lead:[
  'Дисциплина помогает выделить время и силы на важное даже тогда, когда день идёт не по плану.',
  'İntizam gün plan üzrə getməyəndə də vacib olan işlərə vaxt və güc ayırmağa kömək edir.',
  'Discipline makes room for what matters even when the day does not go to plan.'
 ], sections:[
  {title:['Почему условия важны','Şərait niyə vacibdir','Why circumstances matter'], text:[
   'Привычки складываются из повторяющихся действий и обстоятельств, в которых мы их совершаем. Когда у дела есть понятное место в распорядке, решение о нём реже приходится принимать заново. Под нагрузкой помогает заранее понимать, что можно сократить, что перенести и чем стоит заняться в первую очередь.',
   'Vərdişlər təkrarlanan hərəkətlərdən və onları etdiyimiz şəraitdən formalaşır. Bir işin gündəlik rejimdə aydın yeri olanda onun barədə hər dəfə yenidən qərar verməyə daha az ehtiyac qalır. Yük çoxalanda nəyin həcmini azaltmağı, nəyi təxirə salmağı və nədən başlamağı öncədən düşünmək kömək edir.',
   'Habits take shape through repeated actions and the circumstances in which they happen. When something has a clear place in our routine, we have to make the decision from scratch less often. Under pressure, it helps to know what can be shortened, what can wait and what deserves priority.'
  ]},
  {title:['Как связать направления','İstiqamətləri necə birləşdirək','How the disciplines meet'], text:[
   'После напряжённого дня может быть разумно сохранить время для ужина и отдыха, а тренировку сделать короче. Здесь MIND помогает заметить своё состояние, BODY — соразмерить усилие, NUTRITION — учесть потребность в еде. LIFE связывает эти решения с тем, что мы хотим поддерживать изо дня в день.',
   'Gərgin gündən sonra axşam yeməyinə və istirahətə vaxt saxlayıb məşqi qısaltmaq ağlabatan ola bilər. Bu halda MIND vəziyyətimizi sezməyə, BODY səyi ona uyğun seçməyə, NUTRITION isə qidaya olan ehtiyacı nəzərə almağa kömək edir. LIFE bu qərarları hər gün davam etdirmək istədiyimiz vərdişlərlə bağlayır.',
   'After a demanding day, it may make sense to leave time for dinner and rest and shorten the workout. MIND helps us notice our state, BODY helps us adjust the effort, and NUTRITION makes room for food. LIFE connects those choices to what we want to sustain day after day.'
  ]}
 ], close:[
  'О важном многое говорит то, для чего мы оставляем место, когда времени мало.',
  'Vaxt az olanda nəyə yer ayırdığımız bizim üçün nəyin vacib olduğunu göstərir.',
  'What we make room for when time is short says a great deal about what matters to us.'
 ]}
];

function aboutPage(){
 const {title,tagline,paragraphs,motto}=restartStory;
 const directions=aboutDirections.map(({mark,lead,sections,close},i)=>`<details class="about-direction" id="ph-${tracks[i].toLowerCase()}">
  <summary><span class="about-illustration" aria-hidden="true">${mark}</span><strong>${tracks[i]}</strong><span class="about-toggle" aria-hidden="true"></span></summary>
  <div class="about-reading"><p class="about-reading-lead">${t(...lead)}</p>
  ${sections.map(section=>`<h3>${t(...section.title)}</h3><p>${t(...section.text)}</p>`).join('')}
  <p class="about-reading-close">${t(...close)}</p></div></details>`).join('');
 return `<section class="about-story" aria-labelledby="about-story">
 <h2 id="about-story">${t(...title)}</h2><p class="about-story-lead">${t(...tagline)}</p>
 ${paragraphs.map(paragraph=>`<p>${t(...paragraph)}</p>`).join('')}
 <p class="about-story-lead">${t(...motto)}</p>
 <a href="${pageUrl('founder')}">${t('Познакомиться с основателем','Təsisçi ilə tanış olun','Meet the founder')}</a></section>
 <section class="about-pathways" aria-labelledby="about-directions"><h2 id="about-directions">${t('Философия RESTART','RESTART fəlsəfəsi','The RESTART philosophy')}</h2><div class="about-directions">${directions}</div></section>
 <section class="about-pathways" aria-labelledby="about-weeks"><h2 id="about-weeks">${t('8 недель. 8 этапов. Один путь к себе','8 həftə. 8 mərhələ. Özünə doğru bir yol','8 weeks. 8 stages. One path to yourself')}</h2>
 ${publicWeeks()}</section>`;
}
