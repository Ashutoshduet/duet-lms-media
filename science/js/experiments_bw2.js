// WORK IN PROGRESS (not listed in the app yet): the snakes' scan base and the size of the grasshoppers still need work.
// DUET Science Lab 360, biology in real places, batch BW2: a grassland food web. Take the frogs away and watch what
// happens to everything else in the web over six months.
import { DICT } from './exp_i18n.js';
import { DICT_BW2 } from './exp_i18n_bw2.js';
import * as MW from './mathworld.js';
import * as BW3 from './bioworld3.js';
Object.assign(DICT, DICT_BW2);
const X = (en) => ({ en, ...(DICT[en] || {}) });
const N = (en, hi, hg) => ({ en, hi, hg: hg || en });
const tl = (K, x) => (x && (x[K.app.lang] || x.en)) || '';
const V3 = (K, x, y, z) => new K.THREE.Vector3(x, y, z);
const Wd = (K) => (k) => tl(K, X(k));
const B10 = N('Ch 13 · Our Environment', 'अध्याय 13 · हमारा पर्यावरण', 'Ch 13 · Our Environment');

export const EXPERIMENTS_BW2 = [
  {
    id: 'bw10_food_web', subj: 'biology', cls: 10, ch: B10, world: true, place: 'grass', table: false, topic: 'eco',
    title: X('A food web in a grassland: take the frogs away'),
    aim: X('To see that the living things of a grassland depend on each other: remove one animal with your own hand and watch the rest of the web change over six months.'),
    kind: X('Food webs; balance in an ecosystem'),
    setup(K) {
      const W = Wd(K);
      const gw = K.add(BW3.grassWeb({ W }), 0, 0, { y: 0 }), knob = K.add(MW.pullTab(), 0, -0.42);
      gw.camView = { p: V3(K, 0, 0.95, -0.15), t: V3(K, 0, 0.12, -1.6) };
      BW3.bindWebHands(gw, knob, K.app, { m3: 1, m6: 3 }, { m3: () => K.lab.emit('m3', { obj: gw.id }), m6: () => K.lab.emit('m6', { obj: gw.id }) });
      return { gw, knob };
    },
    steps: [
      { do: X('A patch of grassland. Look around: grass, grasshoppers in it, frogs on the ground, two rat snakes and a hawk on a stump.'), target: 'gw',
        act: async (K, o) => { K.lab.emit('look', { obj: o.gw.id }); await K.sleep(2); }, ev: { type: 'look' },
        see: X('Grasshoppers eat grass, frogs eat grasshoppers, snakes eat frogs and the hawk eats snakes (and frogs too). The chains join into a web.') },
      { do: X('Slide the calendar on three months.'), target: 'knob',
        act: async (K, o) => { await K.tween(3, (k) => o.gw.setMonth(3 * k)); o.gw.setMonth(3); K.lab.emit('m3', { obj: o.gw.id }); }, ev: { type: 'm3' },
        see: X('The numbers hardly change: about 20 grasshoppers, 6 frogs, 2 snakes, and plenty of grass. Each animal keeps the one it eats in check.') },
      { do: X('Now take all the frogs out of the grassland.'), target: 'gw',
        act: async (K, o) => { await new Promise((r) => o.gw.removeFrogs(r)); K.lab.emit('remove', { obj: o.gw.id }); }, ev: { type: 'remove' },
        see: X('The frogs are gone. Nothing changes at once.') },
      { do: X('Slide the calendar on six months without the frogs.'), target: 'knob',
        act: async (K, o) => { await K.tween(4, (k) => o.gw.setMonth(6 * k)); o.gw.setMonth(6); K.lab.emit('m6', { obj: o.gw.id }); }, ev: { type: 'm6' },
        see: X('With nobody eating them, the grasshoppers multiply to about 60 and eat most of the grass. The snakes find no frogs, go hungry and leave.') },
      { do: X('Look at the grass and the stump.'), target: 'gw',
        act: async (K, o) => { K.lab.emit('look2', { obj: o.gw.id }); await K.sleep(2); }, ev: { type: 'look2' },
        see: X('Only about a third of the grass is left, and the hawk has fewer snakes to hunt. Taking away one animal changed the whole web.') },
    ],
    eq: { word: 'No frogs → more grasshoppers → less grass; fewer snakes', sym: 'grass ← grasshopper ← frog ← snake ← hawk' },
    result: { obs: X('With the frogs, the numbers stayed steady. Without them, the grasshoppers tripled, most of the grass was eaten, and the snakes went hungry and left.'),
      concl: X('In a food web every living thing depends on others. Removing one species upsets the balance of the whole ecosystem, so every link, even a frog, matters.'),
      safety: X('Never catch or kill frogs or snakes in the wild; watch them from a distance.'),
      viva: [{ q: X('What is a food web?'), a: X('Many food chains joined together, because most animals eat, and are eaten by, more than one kind of living thing.') },
        { q: X('Why did the grasshoppers multiply when the frogs were removed?'), a: X('Nothing was eating them any more.') },
        { q: X('Why did the snakes leave?'), a: X('Their food, the frogs, was gone.') }] },
  },
];
