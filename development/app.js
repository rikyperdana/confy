var comp = {
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
          ),
          onupdate: () => console.log('sync')
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
                        ['title'], ['abstract'],
                        ['keywords', 'authors'],
                        ['fileLink', 'jle'],
                        ['articleID', 'entryDate', 'eventTarget', 'submiter']
                      ]},
                      action: doc => updateBoth(
                        'events', state.eventDetail._id,
                        _.assign(state.eventDetail, {articles: [
                          ...(state.eventDetail.articles || []), doc
                        ]})
                      )
                    }))
                  ]})
                ]},
                makeIconLabel('download', 'Tambah submisi')
              ), m('br'), m('br'),
              _.get(state, 'eventDetail.articles') && m(autoTable({
                id: 'articlesTable',
                heads: {title: 'Judul Artikel', submiter: 'Pengunggah', authors: 'Penulis', tanggal: 'Tanggal Submisi'},
                rows: state.eventDetail.articles.map(i => ({row: {
                  title: i.title, submiter: '', authors: i.authors.join('; '), tanggal: hari(i.entryDate)
                }, data: i})),
                onclick: data => _.assign(mgState, {comp: () => [
                  m('h2', 'Rincian Artikel'),
                  m('.box', m('.table-container', m('table.table',
                    m('tr',
                      m('th', 'Submiter'), m('td', data.submiter),
                      m('th', 'Tanggal submisi'), m('td', data.entryDate)
                    ),
                    m('tr',
                      m('th', 'Judul artikel'), m('td', data.title),
                      m('th', 'Link file'), m('td', m('a', {href: data.fileLink}, 'Open'))
                    ),
                    m('tr',
                      m('th', 'Authors'), m('td', data.authors.join(', ')),
                      m('th', 'Keywords'), m('td', data.keywords.join(', ')),
                    )
                  ), m('p', 'Abstract: '+(data.abstract || '')))),
                  m('.button.is-info', {
                    onclick: () => updateBoth(
                      'events', state.eventDetail._id,
                      _.assign(state.eventDetail, {articles: state.eventDetail.articles.map(
                        i => i.articleID === data.articleID ?
                        _.assign(i, {reviews: [
                          ...(i.reviews || []),
                          {requestDate: _.now()}
                        ]}) : i
                      )})
                    )
                  }, makeIconLabel('download', 'Permohonan Review')),
                  m('br'), m('br'),
                  _.get(data, 'reviews') && m(autoTable({
                    id: 'reviewsTable',
                    heads: {
                      requestDate: 'Tanggal permohonan', respondDate: 'Tanggal respon',
                      text: 'Ulasan reviewer', status: 'Status ulasan'
                    },
                    rows: data.reviews.map(i => ({row: {
                      requestDate: hari(i.requestDate), respondDate: i.respondDate,
                      text: i.text, status: i.status
                    }, data: i})),
                    onclick: dataReview => [
                      _.assign(state, {modalReview: m('.box',
                        m('h3', 'Rincian Ulasan'),
                        m(autoForm({
                          id: 'reviewForm', schema: schemas.review,
                          action: doc => console.log(
                            'events', state.eventDetail._id,
                            _.assign(state.eventDetail, {
                              articles: state.eventDetail.articles.map(
                                i => i.articleID === data.articleID ?
                                _.assign(i, {reviews: data.reviews.map(
                                  j => j.requestDate === dataReview.requestDate ?
                                  _.assign(j, doc) : j
                                )}) : i
                              )
                            })
                          )
                        }))
                      )}),
                      m.redraw()
                    ]
                  })),
                  makeModal('modalReview')
                ]})
              })),
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
              id: 'addEvent',
              schema: schemas.event,
              layout: layouts.event,
              action: doc => insertBoth(
                'events', doc,
                console.log('event baru')
              )
            }))
          ]
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
                action: doc => db.users.toArray(
                  array => !array.find(i => i.username === doc.username) &&
                  io().emit('bcrypt', doc.password, password => db.users.put(
                      _.assign(doc, {password, _id: data._id})
                    )
                  )
                )
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
              action: doc => db.users.toArray(
                array => !array.find(i => i.username === doc.username) &&
                io().emit(
                  'bcrypt', doc.password,
                  password => insertBoth('users',
                    _.assign(doc, {password}),
                    console.log
                  )
                )
              )
            }))
          ]
        },
        login: {
          hideMenu: true,
          comp: m(autoForm({
            id: 'login',
            schema: {
              username: {type: String},
              password: {type: String, autoform: {type: 'password'}}
            },
            action: doc => io().emit('login', doc, res => res && [
              localStorage.setItem('login', JSON.stringify(res.res)),
              m.redraw()
            ])
          }))
        }
      }
    }
  },
  end: {
    name: 'user', full: 'User Menu',
    comp: () => m('h1', 'User Profile'),
    submenu: {
      login: {
        full: 'Sign In/Up', icon: 'sign-in-alt',
        comp: () => comp.start.users.submenu.login.comp
      },
      profile: {
        icon: 'address-card',
        comp: () => m('h1', 'My Profile')
      },
      subs: {full: 'Subscription', icon: 'rss'},
      logout: {icon: 'sign-out-alt'}
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
