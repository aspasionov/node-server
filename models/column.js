const {Schema, model} = require('mongoose')

const columnSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  label: String,
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cards: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Task',
      required: true,
      default: []
    }
  ]
})

columnSchema.methods.addCard = function(card) {
  this.cards = [...this.cards, card._id];
  return this.save()
}

columnSchema.method('toClient', function() {
  const obj = this.toObject();

  //Rename fields
  obj.id = obj._id;
  delete obj._id;

  return obj;
});



module.exports = model('Column', columnSchema)
