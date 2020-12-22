var comp = {
  event: () => [
    m('h2', 'Rincian Event'),
    m('.box', m('.table-container', m('table.table',
      m('tr',
        m('th', 'Judul Event'), m('td', _.get(state, 'eventDetail.title')),
        m('th', 'Jumlah Submisi'), m('td', _.get(state, 'eventDetail.articles.length'))
      ),
      m('tr',
        m('th', 'Mulai buka'), m('td', hari(_.get(state, 'eventDetail.buka'))),
        m('th', 'Terakhir tutup'), m('td', hari(_.get(state, 'eventDetail.tutup'))),
        m('th', 'Template Paper'), m('td', m('a', {href: 'https://google.com', target: '_blank'}, 'Link'))
      )
    ))),
    withThis(
      JSON.parse(localStorage.login || '{}'),
      user => ands([
        user.peran === 'submiter',
        !(state.eventDetail.articles || []).filter(i => i.submiter === user._id).length
      ])
    ) && [
      m('.button.is-info',
        {onclick: () => [
          _.assign(mgState, {comp: () => [
            m('h2', 'Form Submisi'),
            m(autoForm({
              id: 'submissionForm', schema: schemas.article,
              layout: {top: [
                ['title'], ['abstract'],
                ['keywords', 'authors'],
                ['fileLink', 'jel'],
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
        makeIconLabel('plus', 'Tambah submisi')
      ), m('br'), m('br')
    ],
    m('h3', 'Artikel masuk'),
    _.get(state, 'eventDetail.articles') && m(autoTable({
      id: 'articlesTable',
      heads: {
        title: 'Judul Artikel', submiter: 'Pengunggah',
        authors: 'Penulis', tanggal: 'Tanggal Submisi',
        revisi: 'Revisi', lastStatus: 'Status Terakhir'
      },
      rows: state.eventDetail.articles.map(i => ({row: {
        title: i.title, submiter: lookUser(i.submiter),
        authors: i.authors.join('; '), tanggal: hari(i.entryDate),
        revisi: (i.reviews || []).length+' kali',
        lastStatus: lookStatus(_.last(i.reviews || []).status) || 'Menunggu ulasan'
      }, data: i})),
      onclick: data => withThis(
        JSON.parse(localStorage.login),
        user => user.peran === 'admin' ? true : data.submiter === user._id
      ) && _.assign(mgState, {comp: comp.article(data)})
    })),
  ],
  article: data => () => [
    m('h2', 'Rincian Artikel'),
    m('.box', m('.table-container', m('table.table',
      m('tr',
        m('th', 'Submiter'), m('td', lookUser(data.submiter)),
        m('th', 'Tanggal submisi'), m('td', hari(data.entryDate))
      ),
      m('tr',
        m('th', 'Judul artikel'), m('td', data.title),
        m('th', 'Link file'), m('td', m('a', {href: data.fileLink, target: '_blank'}, 'Open'))
      ),
      m('tr',
        m('th', 'Authors'), m('td', data.authors.join(', ')),
        m('th', 'Keywords'), m('td', data.keywords.join(', ')),
      ),
      m('tr',
        m('th', 'Kontak'), m('td', '+62'+lookUser(data.submiter, 'phone')),
        m('th', 'Email'), m('td', lookUser(data.submiter, 'email')),
      )
    ), m('p', 'Abstract: '+(data.abstract || '')))),
    _.get(JSON.parse(localStorage.login), 'peran') === 'submiter' && ors([
      !(data.reviews || []).length,
      (data.reviews || []).every(i => i.status),
    ]) && [
      m('.button.is-info', {
        onclick: () => confirm('Yakin sudah mempersiapkan/memperbaharui dokumen?') && updateBoth(
          'events', state.eventDetail._id,
          _.assign(state.eventDetail, {articles: state.eventDetail.articles.map(
            i => i.articleID === data.articleID ?
            _.assign(i, {reviews: [
              ...(i.reviews || []),
              {requestDate: _.now()}
            ]}) : i
          )})
        )
      }, makeIconLabel('plus', 'Tambah Permohonan Review')),
      m('br'), m('br'),
    ],
    _.get(data, 'reviews') && m(autoTable({
      id: 'reviewsTable',
      heads: {
        requestDate: 'Tanggal permohonan', respondDate: 'Tanggal respon',
        text: 'Ulasan reviewer', reviewer: 'Nama Reviewer', status: 'Status ulasan'
      },
      rows: data.reviews.map(i => ({row: {
        requestDate: hari(i.requestDate), respondDate: hari(i.respondDate),
        text: i.text, reviewer: lookUser(i.reviewer),
        status: lookStatus(i.status) || 'Menunggu ulasan'
      }, data: i})),
      onclick: dataReview => [
        _.assign(state, {modalReview: m('.box',
          m('h3', 'Rincian Ulasan'),
          _.get(JSON.parse(localStorage.login || '{}'), 'peran') === 'admin' ? m(autoForm({
            id: 'reviewForm',
            schema: schemas.review,
            doc: dataReview,
            action: doc => updateBoth(
              'events', state.eventDetail._id,
              _.assign(state.eventDetail, {
                articles: state.eventDetail.articles.map(
                  i => i.articleID === data.articleID ?
                  _.assign(i, {reviews: data.reviews.map(
                    j => j.requestDate === dataReview.requestDate ?
                    _.assign(j, doc, {respondDate: _.now()}) : j
                  )}) : i
                )
              }),
              res => [
                _.assign(state, {modalReview: null}),
                m.redraw()
              ]
            )
          })) : m('p', dataReview.text)
        )}),
        m.redraw()
      ]
    })),
    makeModal('modalReview')
  ],
  login: () => m('.columns',
    m('.column'),
    m('.column', [
      _.range(3).map(() => m('br')),
      m('.level', m('.level-item.has-text-centered',
        m('span.icon.is-large.has-text-primary', m('i.fas.fa-8x.fa-comments'))
      )), m('br'),
      m(autoForm({
        id: 'login',
        schema: {
          username: {type: String},
          password: {type: String, autoform: {type: 'password'}}
        },
        action: doc => io().emit('login', doc, res => res && [
          localStorage.setItem('login', JSON.stringify(res.res)),
          _.assign(mgState, {comp: menu.start.conferences.comp}),
          m.redraw()
        ])
      }))
    ]),
    m('.column'),
  ),
  users: () => [
    m('h2', {
      oncreate: () => [onupdate(), getDifferences()],
      onupdate
    }, 'Manajemen Pengguna'),
    state.usersList && m(autoTable({
      id: 'usersTable',
      heads: {fullName: 'Nama Lengkap', email: 'E-Mail', peran: 'Peranan'},
      rows: state.usersList.map(i => ({row: {
        fullName: i.fullName, email: i.email, peran: lookUser(i._id, 'peran')
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
              io().emit('bcrypt', doc.password, password => updateBoth(
                'users', data._id, _.assign(doc, {password})
              ))
            )
          }))
        )}),
        m.redraw()
      ]
    })),
    makeModal('modalUser')
  ]
}

var menu = {
  brand: {
    name: 'home', full: 'Dashboard',
    comp: () => !localStorage.login ? comp.login() : undefined
  },
  start: {
    conferences: {
      icon: 'comments',
      comp: () => loginFirst([
        m('h2', {
          oncreate: () => [onupdate(), getDifferences()],
          onupdate
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
            _.assign(mgState, {comp: comp.event}),
            m.redraw()
          ]
        }))
      ]),
      submenu: {
        add: {
          full: 'Tambah Event', icon: 'download',
          comp: () => loginFirst(onlyAdmin([
            m('h2', 'Form Tambah Event'),
            m(autoForm({
              id: 'addEvent',
              schema: schemas.event,
              layout: layouts.event,
              action: doc => insertBoth(
                'events', doc,
                res => res && [
                  _.assign(state, {eventDetail: res}),
                  _.assign(mgState, {comp: comp.event}),
                  m.redraw()
                ]
              )
            }))
          ]))
        }
      }
    },
    users: {
      icon: 'users',
      comp: () => loginFirst(onlyAdmin(comp.users())),
      submenu: {
        add: {
          full: 'Tambah User', icon: 'user-plus',
          comp: () => loginFirst(onlyAdmin([
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
                    res => res && [
                      _.assign(mgState, {comp: comp.users}),
                      m.redraw()
                    ]
                  )
                )
              )
            }))
          ]))
        },
      }
    }
  },
  end: {
    name: 'user', full: 'User Menu',
    comp: () => m('h1', 'User Profile'),
    submenu: {
      login: {
        full: 'Sign In/Up', icon: 'sign-in-alt',
        comp: comp.login
      },
      profile: {
        icon: 'address-card',
        comp: () => loginFirst([
          m('h1', 'My Profile'),
          withThis(
            JSON.parse(localStorage.login),
            user => m('.box', m('.table-container', m('table.table',
              m('tr',
                m('th', 'Username'), m('td', user.username)
              )
            )))
          )
        ])
      },
      logout: {
        icon: 'sign-out-alt',
        comp: () => m('div', {
          oncreate: () => [
            localStorage.removeItem('login'),
            m.redraw()
          ]
        })
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

m.mount(document.body, mitGen(menu, {}))
