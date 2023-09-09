const {Schema, model} = require('mongoose')

const taskSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  label: String,
  order: Number,
  background: String,
  draggable: {
    type: Boolean,
    default: true
  },
  columnId: {
    type: Schema.Types.ObjectId,
    ref: 'Column',
    required: true
  }
})

module.exports = model('Task', taskSchema)
