// Reflex (touch a hot tawa: skin -> sensory nerve -> spinal cord -> motor nerve -> muscle, then the brain feels it) and
// Hormones (the endocrine glands and what their chemical messages do), step by step.
// Hindi and Hinglish texts are merged at runtime from models/content.json by step id.
const GLANDS = ['pituitary', 'thyroid', 'adrenal', 'pancreas'];
const HEART = ['heart_ra', 'heart_rv', 'heart_la', 'heart_lv'];

export const REFLEX = {
  id: 'reflex', sys: 'nervous', icon: '⚡',
  title: { en: 'Reflex: the quick escape' },
  steps: [
    { view: { at: [-0.285, 0.8, 0.045], z: 5.5, side: -0.45 }, focus: ['hand', 'radius', 'ulna', 'nerves'], show: ['fine'], flows: ['hot'], labels: ['hand_bones', 'median_nerve'],
      title: { en: 'Ouch, a hot tawa!' },
      text: { en: 'Imagine your fingertips touch a hot tawa. In the skin there are tiny sense cells, called receptors, for heat, touch and pain. The heat receptors fire at once and start an electric signal in a nerve.' } },
    { view: { at: [-0.17, 1.12, 0.0], z: 1.6, side: -0.55 }, focus: ['nerves', 'hand', 'radius', 'ulna', 'humerus', 'spinal_cord', 'vertebrae'], show: ['fine'], flows: ['reflex_in'], labels: ['median_nerve', 'spinal_cord'],
      title: { en: 'Up the sensory nerve' },
      text: { en: 'The signal races up the arm in a sensory nerve, faster than a train, at about 100 metres every second. It enters the spinal cord in the neck, through the back root of a spinal nerve.' } },
    { view: { at: [0, 1.45, -0.04], z: 5.0, side: -0.9 }, focus: ['spinal_cord', 'vertebrae', 'nerves', 'brainstem'], ghost: ['vertebrae'], show: ['fine'], micro: 'reflex', flows: ['reflex_in', 'reflex_out'], labels: ['spinal_cord', 'brachial_plexus'],
      title: { en: 'The spinal cord decides' },
      text: { en: 'Inside the spinal cord, the sensory neuron passes the signal to a small relay neuron, and the relay neuron passes it straight to a motor neuron. The spinal cord gives the order by itself. It does not wait for the brain, because waiting could mean a bad burn.' } },
    { view: { at: [-0.2, 1.2, 0.0], z: 2.2, side: -0.5 }, focus: ['nerves', 'muscles', 'humerus', 'radius', 'ulna', 'spinal_cord'], ghost: ['muscles'], show: ['muscles', 'fine'], flows: ['reflex_out'], labels: ['biceps', 'brachial_plexus'],
      title: { en: 'The muscle pulls the hand away' },
      text: { en: 'The motor nerve carries the order to the muscles of the arm. The biceps contracts and the hand jumps away from the tawa. From touch to escape takes only a few hundredths of a second, quicker than a blink.' } },
    { view: { at: [0, 1.46, 0.0], z: 2.0, side: -0.7 }, focus: ['spinal_cord', 'brainstem', 'cerebrum', 'cerebellum', 'nerves'], ghostSkull: true, flows: ['pain_up', 'brain_spark'], labels: ['spinal_cord', 'cerebrum'],
      title: { en: 'Then the brain feels it' },
      text: { en: 'The signal also travels up the spinal cord to the brain. Only when it reaches the brain do you feel the pain and say Ouch! By then your hand is already safe. The brain also remembers, so next time you are more careful near a hot tawa.' } },
    { view: { at: [0, 1.15, 0.0], z: 1.1 }, focus: ['cerebrum', 'cerebellum', 'brainstem', 'spinal_cord', 'nerves', 'eyes'], show: ['fine'], flows: ['spinal_signals', 'nerve_signals'], labels: ['spinal_cord', 'eyes'],
      title: { en: 'Reflexes keep us safe' },
      text: { en: 'This path, from the receptor to the sensory neuron, the relay neuron, the motor neuron and the muscle, is called a reflex arc. Blinking when something comes near the eye, sneezing, coughing and the knee jerk are reflexes too. To watch the arm pull back, open the Organ Lab: Arm muscles and reflex.' } },
  ],
};

export const HORMONES = {
  id: 'hormones', sys: 'endocrine', icon: '💧',
  title: { en: 'Hormones: chemical messages' },
  steps: [
    { view: { at: [0, 1.33, 0.02], z: 1.3 }, focus: [...GLANDS, ...HEART, 'arteries'], anim: ['heartbeat'], flows: ['hormone_all'], labels: ['pituitary', 'thyroid_gland', 'adrenal_glands', 'pancreas'],
      title: { en: 'Chemical messengers' },
      text: { en: 'Nerves send quick electric messages. The body also sends slower chemical messages, called hormones. They are made by endocrine glands, which pour them straight into the blood, without any tube. The blood carries them everywhere, but each hormone works only on its own target organs.' } },
    { view: { at: 'pituitary', z: 7.5, side: 0.9 }, focus: ['pituitary', 'cerebrum', 'brainstem', 'cerebellum'], ghostSkull: true, ghost: ['cerebrum', 'cerebellum'], flows: ['hormone_pit'], labels: ['pituitary', 'hypothalamus'],
      title: { en: 'Pituitary: the master gland' },
      text: { en: 'Under the brain hangs a gland the size of a pea, the pituitary. The hypothalamus of the brain above it tells it what to do. It makes growth hormone, which helps the body and bones grow. Too little in childhood makes a person very short, and too much makes them very tall. It also controls many other glands, so it is called the master gland.' } },
    { view: { at: 'thyroid', z: 6.5, side: 0.35 }, focus: ['thyroid', 'larynx', 'trachea'], flows: ['hormone_thy'], labels: ['thyroid_gland', 'larynx'],
      title: { en: 'Thyroid: the body\'s speed control' },
      text: { en: 'The thyroid is a butterfly-shaped gland in the front of the neck. Its hormone, thyroxine, controls how fast the body uses food for energy. To make thyroxine, the thyroid needs iodine. Without enough iodine the neck swells. This is called goitre. That is why we use iodised salt.' } },
    { view: { at: 'adrenal', z: 4.2, side: 0.3 }, focus: ['adrenal', 'kidney_l', 'kidney_r', ...HEART, 'lung_r', 'lung_l'], ghost: ['lung_r', 'lung_l'], anim: ['heartbeat', 'breathe'], flows: ['hormone_adr', 'blood_arteries'], labels: ['adrenal_glands', 'kidney_l'],
      title: { en: 'Adrenal glands: ready for action' },
      text: { en: 'On top of each kidney sits an adrenal gland. When you are scared, or a dog suddenly chases you, they release adrenaline into the blood. The heart beats faster, you breathe faster, and more blood rushes to the muscles. The body is ready to run or to fight.' } },
    { view: { at: 'pancreas', z: 4.2 }, focus: ['pancreas', 'liver', 'duodenum', 'stomach', 'spleen'], ghost: ['stomach', 'liver'], micro: 'islets', flows: ['hormone_pan'], labels: ['pancreas', 'liver'],
      title: { en: 'Pancreas: the sugar balance' },
      text: { en: 'Tiny islets in the pancreas make insulin. After a meal, insulin helps sugar from the blood enter the cells, and tells the liver to store the extra. Between meals another hormone, glucagon, lets the liver release sugar again. If too little insulin is made, sugar stays high in the blood. This is diabetes.' } },
    { view: { at: [0, 1.0, 0.0], z: 1.0 }, focus: [...GLANDS, 'cerebrum'], flows: ['hormone_pit', 'hormone_all'], labels: ['pituitary', 'thyroid_gland'],
      title: { en: 'Growing up' },
      text: { en: 'Between about 10 and 14 years of age, the pituitary tells the testes in boys to make testosterone, and the ovaries in girls to make oestrogen. These hormones bring the changes of growing up, called puberty: a growth spurt, a deeper voice in boys, and more. These changes are natural, and they come at different ages for different children.' } },
    { view: { at: [0, 1.25, 0.02], z: 1.25 }, focus: [...GLANDS, 'liver', ...HEART, 'arteries'], anim: ['heartbeat'], flows: ['hormone_pan', 'glucose_body'], labels: ['pancreas', 'liver', 'thyroid_gland'],
      title: { en: 'Just the right amount' },
      text: { en: 'Hormones must be made in just the right amount. The body checks and corrects itself: when blood sugar goes up, the pancreas makes more insulin, and when sugar comes down, it makes less. This is called feedback. A balanced diet with iodised salt, enough sleep and daily play keep your glands healthy.' } },
  ],
};
