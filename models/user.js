const  {Schema, model } = require('mongoose')

const userSchema = new Schema ({
  email: {
    type: String,
    required: true
  },
  name: String,
  password: {
    type: String,
    required: true
  },
  // columns: [
  //   {
  //     columnId: {
  //       type: Schema.Types.ObjectId,
  //       ref: 'Column',
  //       required: true
  //     }
  //   }
  // ],
  // resetToken: String,
  // resetTokenExp: Date,
  avatarUrl: String
})

module.exports = model('User', userSchema)
