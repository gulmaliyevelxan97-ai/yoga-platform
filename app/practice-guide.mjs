const guides = {
 yoga: [
  ['Встаньте удобно и почувствуйте опору под стопами.', 'Rahat dayanın və ayaqlarınızın altındakı dayağı hiss edin.', 'Stand comfortably and feel the floor under your feet.'],
  ['Медленно переходите между знакомыми позами. Дышите свободно.', 'Tanış pozalar arasında yavaş keçid edin. Sərbəst nəfəs alın.', 'Move slowly between familiar poses. Breathe freely.'],
  ['Вернитесь в удобную позу и на несколько вдохов останьтесь в ней.', 'Rahat pozaya qayıdın və bir neçə nəfəs o vəziyyətdə qalın.', 'Return to a comfortable pose and stay there for a few breaths.']
 ],
 breathing: [
  ['Сядьте удобно. Расслабьте плечи и челюсть.', 'Rahat oturun. Çiyinlərinizi və çənənizi boşaldın.', 'Sit comfortably. Relax your shoulders and jaw.'],
  ['Замечайте вдох и выдох. Сохраняйте естественный ритм без задержек.', 'Nəfəs alıb-verməyinizə diqqət yetirin. Nəfəsi saxlamadan təbii ritmi qoruyun.', 'Notice each inhale and exhale. Keep your natural rhythm without holding your breath.'],
  ['Переведите внимание на звуки и опору под телом.', 'Diqqətinizi səslərə və bədəninizin dayandığı səthə yönəldin.', 'Bring your attention back to nearby sounds and the surface supporting you.']
 ],
 meditation: [
  ['Сядьте удобно. Оставьте взгляд мягким или прикройте глаза.', 'Rahat oturun. Baxışınızı yumşaldın və ya gözlərinizi yüngülcə yumun.', 'Sit comfortably. Soften your gaze or gently close your eyes.'],
  ['Заметьте один звук или ощущение опоры. Когда отвлечётесь, мягко вернитесь к нему.', 'Bir səsə və ya dayaq hissinə diqqət yetirin. Fikriniz yayınanda sakitcə həmin hissə qayıdın.', 'Notice a sound or the sensation of support. When distracted, gently return to it.'],
  ['Откройте глаза и отметьте, как вы себя чувствуете.', 'Gözlərinizi açın və özünüzü necə hiss etdiyinizə diqqət yetirin.', 'Open your eyes and notice how you feel.']
 ],
 mobility: [
  ['Начните с медленных кругов плечами.', 'Çiyinlərinizi yavaşca dairəvi hərəkət etdirin.', 'Start with slow shoulder circles.'],
  ['Добавьте мягкие повороты корпуса в комфортном диапазоне.', 'Rahat amplitudada gövdənizi yüngülcə sağa və sola çevirin.', 'Add gentle turns of the torso within a comfortable range.'],
  ['Уменьшите амплитуду, замедлитесь и остановитесь.', 'Hərəkətləri kiçildin, yavaşlayın və dayanın.', 'Make the movements smaller, slow down, and stop.']
 ],
 strength: [
  ['Подготовьтесь короткой спокойной ходьбой на месте.', 'Yerinizdə qısa və rahat addımlarla hazırlaşın.', 'Warm up with a short, easy march in place.'],
  ['Чередуйте знакомые упражнения, например вставания со стула и отжимания от стены. Отдыхайте между подходами.', 'Stuldan qalxmaq və divardan təkan vermək kimi tanış məşqləri növbələyin. Yanaşmalar arasında dincəlin.', 'Alternate familiar movements such as chair sit-to-stands and wall push-ups. Rest between sets.'],
  ['Завершите спокойной ходьбой и дайте дыханию вернуться к обычному ритму.', 'Sakit addımlarla bitirin və nəfəsinizin adi ritmə qayıtmasına vaxt verin.', 'Finish with easy walking and let your breathing return to its usual rhythm.']
 ],
 recovery: [
  ['Выберите спокойное место и удобное положение.', 'Sakit yer və rahat vəziyyət seçin.', 'Find a quiet spot and a comfortable position.'],
  ['Заметьте, где тело опирается на поверхность. Позвольте плечам расслабиться.', 'Bədəninizin səthə toxunduğu yerləri hiss edin. Çiyinlərinizi boşaldın.', 'Notice where your body meets the surface. Let your shoulders relax.'],
  ['Пошевелите пальцами и возвращайтесь к движению в своём темпе.', 'Barmaqlarınızı tərpədin və öz tempinizlə hərəkətə qayıdın.', 'Wiggle your fingers and return to movement at your own pace.']
 ]
};

export function practiceGuide(id, index) {
 return Object.hasOwn(guides,id) ? guides[id].map(step=>step[index] ?? step[0]) : [];
}

export function practiceStage(seconds, duration) {
 return duration > 0 ? Math.min(2,Math.max(0,Math.floor(seconds*3/duration))) : 0;
}
