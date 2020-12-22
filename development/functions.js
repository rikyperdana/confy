var state = {},

withThis = (obj, cb) => cb(obj),

randomId = () => [1, 1].map(() =>
  Math.random().toString(36).slice(2)
).join(''),

hari = (timestamp, hour) =>
  timestamp && moment(timestamp)
  .format('Do MMMM YYYY'+(hour ? ', hh:mm' : '')),

makeIconLabel = (icon, label) => [
  m('span.icon', m('i.fas.fa-'+icon)),
  m('span', label)
],

makeModal = name => m('.modal',
  {class: state[name] && 'is-active'},
  m('.modal-background'),
  m('.modal-content', state[name]),
  m('.modal-close.is-large', {onclick: () =>
    [state[name] = null, m.redraw()]
  })
),

db = new Dexie('conference'),

dbCall = (body, action) => io().emit('dbCall', body, action),

insertBoth = (collName, doc, cb) => withThis(
  _.merge(doc, {_id: randomId(), updated: _.now()}),
  obj => dbCall(
    {method: 'insertOne', collection: collName, document: obj},
    res => res && [
      cb && cb(obj), db[collName].put(obj),
      io().emit('datachange', collName, doc)
    ]
  )
),

updateBoth = (collName, _id, doc, cb) => withThis(
  _.merge(doc, {_id, updated: _.now()}),
  // pastikan di server terupdate dulu, baru client
  obj => dbCall(
    {method: 'updateOne', collection: collName, document: obj, _id},
    res => res && [
      cb && cb(res), db[collName].put(obj),
      io().emit('datachange', collName, doc)
    ]
  )
),

lookUser = (id, prop) =>
  !id ? '-' : _.get(state.usersList.find(
    i => i._id === id
  ), prop || 'fullName') || '-',

onupdate = () => [
  db.events.toArray(array => [
    _.assign(state, {eventsList: array}),
    m.redraw()
  ]),
  db.users.toArray(array => [
    _.assign(state, {usersList: array}),
    m.redraw()
  ])
],

loginFirst = comp => !localStorage.login ? m('p', 'Mohon login terlebih dahulu') : comp,

onlyAdmin = comp => _.get(JSON.parse(localStorage.login), 'peran') === 'admin' ? comp
  : m('p', 'Hanya untuk admin'),

lookStatus = num => _.get([
  {value: 1, label: 'Perbaiki'},
  {value: 2, label: 'Tolak'},
  {value: 3, label: 'Final'},
].find(i => i.value === num), 'label'),

getDifference = name => db[name].toArray(array => dbCall(
  {
    method: 'getDifference', collection: name,
    clientColl: array.map(i =>
      _.pick(i, ['_id', 'updated'])
    )
  },
  res => res && [
    db[name].bulkPut(res),
    _.assign(state, {lastSync: _.now(), loading: false}),
    console.log('synced'),
    m.redraw()
  ])
),

getDifferences = () => ['events', 'users'].map(name => getDifference(name))
