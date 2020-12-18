var state = {},

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

schemas = {
  user: {
    _id: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    username: {type: String},
    password: {type: String, autoform: {type: 'password'}},
    fullName: {type: String, label: 'Nama Lengkap'},
    email: {type: String, optional: true},
    peran: {
      type: String,
      autoform: {
        type: 'select',
        options: () => ['admin', 'submiter'].map(
          i => ({value: i, label: _.startCase(i)})
        )
      },
    }
  },
  event: {
    _id: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    title: {
      type: String,
      label: 'Judul Event'
    },
    create: {
      type: Number,
      autoform: {type: 'hidden'},
      autoValue: () => _.now()
    },
    buka: {type: Date, label: 'Mulai buka submisi'},
    tutup: {type: Date, label: 'Terakhir tutup submisi'}
  },
  article: {
    title: {type: String, label: 'Judul Artikel'},
    keywords: {type: Array, label: 'Kata kunci'},
    'keywords.$': {type: String},
    authors: {type: Array, label: 'Penulis'},
    'authors.$': {type: String},
    jle: {type: String, label: 'JLE Classification'},
    fileLink: {type: String, autoform: {
      help: 'Tautan Google Drive / Dropbox / OneDrive'
    }},
    entryDate: {
      type: Number,
      autoform: {type: 'hidden'},
      autoValue: () => _.now()
    },
    eventTarget: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => _.get(state, 'eventDetail._id')
    }
    // submiter: {type: String}
  }
},

layouts = {
  user: {top: [
    ['username', 'password'],
    ['fullName', 'email'],
    ['peran', '_id']
  ]}
},

comp = {
  brand: { name: 'home', full: 'Dashboard'},
  start: {
    conferences: {
      icon: 'download',
      comp: () => [
        m('h2', {
          oncreate: () => db.events.toArray(
            array => [
              _.assign(state, {eventsList: array}),
              m.redraw()
            ]
          )
        }, 'Daftar Events'),
        _.get(state, 'eventsList') &&
        m(autoTable({
          id: 'eventsTable',
          heads: {title: 'Judul Event', buka: 'Mulai Buka', tutup: 'Batas Akhir'},
          rows: state.eventsList.map(i => ({row: {
            title: i.title, buka: hari(i.buka), tutup: hari(i.tutup)
          }, data: i})),
          onclick: data => [
            _.assign(state, {eventDetail: data}),
            _.assign(mgState, {comp: () => [
              m('h2', 'Rincian Event'),
              m('.box', m('.table-container', m('table.table',
                m('tr',
                  m('th', 'Judul Event'), m('td', _.get(state, 'eventDetail.title')),
                  m('th', 'Jumlah Submisi'), m('td', 0)
                ),
                m('tr',
                  m('th', 'Mulai buka'), m('td', hari(_.get(state, 'eventDetail.buka'))),
                  m('th', 'Terakhir tutup'), m('td', hari(_.get(state, 'eventDetail.tutup')))
                )
              ))),
              m('.button.is-info',
                {onclick: () => [
                  _.assign(mgState, {comp: () => [
                    m('h2', 'Form'),
                    m(autoForm({
                      id: 'submissionForm', schema: schemas.article,
                      layout: {top: [
                        ['title'], ['keywords', 'authors'],
                        ['fileLink', 'jle'], ['entryDate', 'eventTarget']
                      ]},
                      action: doc => [
                        db.events.put(_.assign(state.eventDetail, {
                          articles: [
                            ...(state.eventDetail.articles || []),
                            doc
                          ]
                        }))
                      ]
                    }))
                  ]})
                ]},
                makeIconLabel('download', 'Tambah submisi')
              ), m('br'), m('br'),
              m(autoTable({
                id: 'articlesTable',
                heads: {title: 'Judul Artikel', submiter: 'Pengunggah', authors: 'Penulis', tanggal: 'Tanggal Submisi'},
                rows: state.eventDetail.articles.map(i => ({row: {
                  title: i.title, submiter: '', authors: i.authors.join('; '), tanggal: hari(i.entryDate)
                }, data: i}))
              })),
              makeModal('modalSubmisi')
            ]}),
            m.redraw()
          ]
        }))
      ],
      submenu: {
        add: {
          full: 'Tambah Event', icon: 'download',
          comp: () => [
            m('h2', 'Form Tambah Event'),
            m(autoForm({
              id: 'addEvent', schema: schemas.event,
              action: doc => db.events.put(doc)
            }))
          ]
        },
        event: {
          hideMenu: true,
        }
      }
    },
    users: {
      icon: 'download',
      comp: () => [
        m('h2', {
          oncreate: () => db.users.toArray(array => [
            _.assign(state, {usersList: array}),
            m.redraw()
          ])
        }, 'Manajemen Pengguna'),
        state.usersList && m(autoTable({
          id: 'usersTable',
          heads: {fullName: 'Nama Lengkap', email: 'E-Mail'},
          rows: state.usersList.map(i => ({row: {
            fullName: i.fullName, email: i.email
          }, data: i})),
          onclick: data => [
            _.assign(state, {modalUser: m('.box',
              m('h3', 'Update User'),
              m(autoForm({
                id: 'updateUser', doc: data,
                schema: schemas.user,
                layout: layouts.user,
                action: console.log
              }))
            )}),
            m.redraw()
          ]
        })),
        makeModal('modalUser')
      ],
      submenu: {
        add: {
          full: 'Tambah User', icon: 'download',
          comp: () => [
            m('h2', 'Tambah User'),
            m(autoForm({
              id: 'addUser', schema: schemas.user,
              layout: layouts.user,
              action: doc => [
                db.users.put(doc),
                // reroute ke halaman users
              ]
            }))
          ]
        }
      }
    }
  }
}

db.version(1).stores(
  ['users', 'events'].reduce(
    (res, inc) => _.merge(res, {[inc]: '_id'}),
    {}
  )
)

m.mount(document.body, mitGen(comp, {}))
