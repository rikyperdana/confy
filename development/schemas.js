var schemas = {
  user: {
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
    title: {
      type: String,
      label: 'Judul Event'
    },
    buka: {type: Date, label: 'Mulai buka submisi'},
    tutup: {type: Date, label: 'Terakhir tutup submisi'},
    created: {
      type: Number,
      autoform: {type: 'hidden'},
      autoValue: () => _.now()
    },
    creator: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => JSON.parse(localStorage.login)._id
    }
  },
  article: {
    articleID: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => randomId()
    },
    title: {type: String, label: 'Judul Artikel'},
    keywords: {type: Array, label: 'Kata kunci'},
    'keywords.$': {type: String},
    authors: {type: Array, label: 'Penulis'},
    'authors.$': {type: String},
    jle: {type: String, label: 'JLE Classification'},
    fileLink: {type: String, autoform: {
      help: 'Tautan Google Drive / Dropbox / OneDrive'
    }},
    abstract: {
      type: String,
      autoform: {type: 'textarea'}
    },
    entryDate: {
      type: Number,
      autoform: {type: 'hidden'},
      autoValue: () => _.now()
    },
    eventTarget: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => _.get(state, 'eventDetail._id')
    },
    submiter: {
      type: String,
      autoform: {type: 'hidden'},
      autoValue: () => JSON.parse(localStorage.login)._id
    }
  },
  review: {
    text: {type: String, autoform: {type: 'textarea'}},
    status: {
      type: Number,
      autoform: {type: 'select', options: () => [
        {value: 1, label: 'Perbaiki'},
        {value: 2, label: 'Tolak'},
      ]}
    }
  }
},

layouts = {
  user: {top: [
    ['username', 'password'],
    ['fullName', 'email'],
    ['peran', '_id']
  ]},
  event: {top: [
    ['title'], ['buka', 'tutup'],
    ['created', 'creator']
  ]}
}
